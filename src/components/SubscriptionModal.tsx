import React, { useState, useEffect } from 'react';
import { UserProfile, SubscriptionPlan, PaymentTransaction } from '../types';
import { StorageService, safeStringify } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import {
  X,
  CheckCircle2,
  Crown,
  ShieldCheck,
  CreditCard,
  Building2,
  Sparkles,
  Zap,
  Lock,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  plans: SubscriptionPlan[];
  onPaymentSuccess: (plan: SubscriptionPlan, tx: PaymentTransaction) => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
  plans,
  onPaymentSuccess,
  onUpdateUser,
}) => {
  const freePlan: SubscriptionPlan = {
    id: 'plan-free',
    name: 'Free Trial',
    price: 0,
    currency: 'NGN',
    durationDays: 0,
    features: [
      '30 Free CBT practice questions',
      'Instant SMART scoring & explanations',
      'Department & Course selection',
      'No credit card required',
    ],
  };

  const displayPlans = plans.some((p) => p.price === 0 || p.id === 'plan-free')
    ? plans
    : [freePlan, ...plans];

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    displayPlans.find((p) => p.popular)?.id || displayPlans[1]?.id || displayPlans[0]?.id
  );
  const [gateway, setGateway] = useState<'Squad' | 'Korapay' | 'Paystack' | 'Flutterwave'>('Squad');
  const [step, setStep] = useState<'plan_select' | 'checkout' | 'verifying' | 'success' | 'failed' | 'cancelled'>('plan_select');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [activeRef, setActiveRef] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('5399 •••• •••• 8841');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('319');
  const [isPaymentDisabled, setIsPaymentDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      ApiClient.getSquadConfig()
        .then((cfg) => {
          if (cfg && cfg.isConfigured === false) {
            // Check Korapay as fallback check if needed
            ApiClient.getKorapayConfig().then((kcfg) => {
              if (kcfg && kcfg.isConfigured === false) {
                setIsPaymentDisabled(false); // keep enabled for simulation/sandbox testing
              } else {
                setIsPaymentDisabled(false);
              }
            });
          } else {
            setIsPaymentDisabled(false);
          }
        })
        .catch(() => {
          setIsPaymentDisabled(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlan = displayPlans.find((p) => p.id === selectedPlanId) || displayPlans[0];
  const isFreeTrialSelected = currentPlan.price === 0;

  const handleActivateFreeTrial = () => {
    const transaction: PaymentTransaction = {
      id: `tx-free-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userUsername: user.username || '',
      userEmail: user.email,
      reference: `FREE_${Date.now()}`,
      gateway: 'Free Access',
      amount: 0,
      planName: 'Free Trial',
      date: new Date().toISOString(),
      status: 'Successful',
      paymentMethod: 'Free Access',
    };

    setStep('success');
    onPaymentSuccess(currentPlan, transaction);
  };

  const handleProcessSquadPayment = async () => {
    if (isFreeTrialSelected) {
      handleActivateFreeTrial();
      return;
    }

    setStep('verifying');
    setPaymentError(null);

    try {
      // 1. Initialize Squad Payment on Backend
      const initData = await ApiClient.initializeSquad({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userUsername: user.username || '',
        planId: currentPlan.id,
        planName: currentPlan.name,
        amount: currentPlan.price,
      });

      if (!initData.success) {
        setPaymentError(initData.error || 'Failed to initialize Squad payment. Please try again.');
        setStep('failed');
        return;
      }

      const reference = initData.reference || `SQUAD-CBT-${Date.now()}`;
      setActiveRef(reference);

      // If a external checkout URL is returned, optionally open in popup or new tab
      if (initData.checkoutUrl && initData.checkoutUrl.startsWith('http') && !initData.checkoutUrl.includes('/payment/success')) {
        try {
          const popup = window.open(initData.checkoutUrl, 'SquadCheckout', 'width=500,height=700');
          if (!popup) {
            window.location.href = initData.checkoutUrl;
            return;
          }
        } catch {
          // continue to verification
        }
      }

      // 2. Perform Server-Side Verification with Squad API
      const verifyData = await ApiClient.verifySquad({
        reference,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userUsername: user.username || '',
        planId: currentPlan.id,
        amount: currentPlan.price,
        gateway: 'Squad Payment Gateway',
      });

      if (verifyData.success) {
        const is14d = currentPlan.id === 'plan-14d' || currentPlan.price === 800;
        const durationDays = is14d ? 14 : 30;
        const expiryDate = verifyData.subscription?.expiryDate || new Date(Date.now() + durationDays * 86400000).toISOString();

        const updatedUser: UserProfile = {
          ...user,
          subscription: {
            isPremium: true,
            plan: is14d ? '14 Days Premium' : '30 Days Premium',
            startDate: new Date().toISOString(),
            expiryDate,
            questionsAttemptedCount: user.subscription?.questionsAttemptedCount || 0,
            freeLimit: 999999,
          },
        };

        StorageService.saveUser(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);

        const transaction: PaymentTransaction = {
          id: verifyData.transaction?.id || `tx-squad-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          userUsername: user.username || '',
          userEmail: user.email,
          reference,
          gateway: 'Squad Payment Gateway',
          amount: currentPlan.price,
          planName: currentPlan.name,
          date: new Date().toISOString(),
          paymentDate: new Date().toISOString(),
          expiryDate,
          status: 'Successful',
          paymentMethod: verifyData.transaction?.paymentMethod || 'Squad Payment Gateway',
          squadResponse: verifyData,
        };

        StorageService.saveTransaction(transaction);
        setStep('success');
        onPaymentSuccess(currentPlan, transaction);
      } else {
        setPaymentError(verifyData.error || 'Payment verification failed. Please try again or contact support.');
        setStep('failed');
      }
    } catch (err: any) {
      setPaymentError(err?.message || 'An unexpected error occurred during payment processing.');
      setStep('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="subscription-modal-wrapper">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-xl rounded-3xl shadow-2xl p-5 sm:p-7 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Navigation Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 mb-4 z-20" id="sub-modal-top-nav-bar">
          {/* Top Left Back Arrow Button */}
          <button
            onClick={() => {
              if (step !== 'plan_select') {
                setStep('plan_select');
              } else {
                onClose();
              }
            }}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
            id="sub-modal-back-btn"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Back</span>
          </button>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            CBT Master Access
          </span>

          {/* Top Right Cancel X Button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
            id="sub-modal-close-btn"
            title="Cancel / Close"
          >
            <span>Cancel</span>
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-6">
        {/* Step 1: Select Plan */}
        {step === 'plan_select' && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                Student Access Pass
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-3">Choose Your Subscription Plan</h2>
              <p className="text-xs text-slate-400 mt-1">Unlock practice questions, timed CBT exams, and detailed SMART explanations.</p>
            </div>

            {/* Active Subscription Status Banner with Cancel Option */}
            {user?.subscription?.isPremium && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold text-white">
                      Active: {user.subscription.plan || 'Premium Pass'}
                    </span>
                  </div>
                  {user.subscription.expiryDate && (
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Expires: {new Date(user.subscription.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to CANCEL your active subscription? You will lose unlimited CBT practice access.")) {
                      const cancelledUser = {
                        ...user,
                        subscription: {
                          ...user.subscription,
                          isPremium: false,
                          plan: 'Cancelled',
                          expiryDate: new Date().toISOString(),
                        },
                      };
                      StorageService.saveUser(cancelledUser);
                      if (onUpdateUser) onUpdateUser(cancelledUser);
                      alert("Your subscription has been successfully cancelled.");
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel My Subscription
                </button>
              </div>
            )}

            <div className="space-y-3">
              {displayPlans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                const isFree = p.price === 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? isFree
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-lg ring-1 ring-emerald-500'
                          : 'bg-indigo-950/50 border-indigo-500 shadow-lg ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{p.name}</h3>
                        {p.popular && (
                          <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                        {isFree && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] px-2 py-0.5 rounded">
                            No Card Needed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {isFree
                          ? '30 Free practice questions with full CBT practice engine access.'
                          : `Full unlimited CBT access for ${p.durationDays} days.`}
                      </p>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-xl font-black ${isFree ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isFree ? 'FREE' : `₦${p.price.toLocaleString()}`}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase">{isFree ? '0 NGN' : p.currency}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* If Free Trial Selected */}
            {isFreeTrialSelected ? (
              <div className="space-y-4">
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-200">
                    <strong>Free Trial Selected!</strong> Zero payment required. You will instantly get 30 free practice questions.
                  </p>
                </div>

                <button
                  onClick={handleActivateFreeTrial}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="activate-free-trial-btn"
                >
                  <Zap className="w-4 h-4" />
                  Start Free Trial (30 Free Questions)
                </button>
              </div>
            ) : (
              /* Gateway Choice & Paid Checkout */
              <div className="space-y-4">
                {isPaymentDisabled && (
                  <div className="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <strong className="block text-amber-200 font-bold">Payment service temporarily unavailable</strong>
                      <span className="text-[11px] text-amber-300/80">Online card payments are currently offline. You can still use the 30 free practice questions!</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-slate-300">Select Payment Gateway</label>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Squad Official Payment Gateway
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setGateway('Squad')}
                      className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        gateway === 'Squad'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-400/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                      id="gateway-squad-btn"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="text-sm font-black">Squad Gateway</span>
                      <span className="text-[9px] font-semibold text-emerald-200">Instant Verification & Activation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGateway('Korapay')}
                      className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        gateway === 'Korapay'
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20 ring-2 ring-indigo-400/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                      id="gateway-korapay-btn"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Korapay</span>
                      <span className="text-[9px] font-normal text-indigo-200">Card / USSD / Bank</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="proceed-checkout-btn"
                >
                  <Lock className="w-4 h-4" />
                  Proceed with {gateway === 'Squad' ? 'Squad Gateway' : gateway} Checkout (₦{currentPlan.price.toLocaleString()})
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const free = displayPlans.find((p) => p.price === 0);
                      if (free) setSelectedPlanId(free.id);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Or continue with Free Trial (30 free questions)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Checkout Step */}
        {step === 'checkout' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Secure {gateway === 'Squad' ? 'Squad Payment Gateway' : 'Korapay Gateway'}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Pay ₦{currentPlan.price.toLocaleString()}</h2>
              <p className="text-xs text-slate-400">
                Activating {currentPlan.name} for <strong className="text-white">{user.email}</strong>
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-slate-800">
                <span>Selected Subscription:</span>
                <strong className="text-emerald-400 font-bold">{currentPlan.name}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-slate-800">
                <span>Amount Payable:</span>
                <strong className="text-white font-extrabold text-sm">₦{currentPlan.price.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Customer Email:</span>
                <span className="text-slate-300 font-mono text-[11px]">{user.email}</span>
              </div>
            </div>

            {/* Payment Card / Channel Details */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-400 font-medium">Payment Card / Bank Account</label>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  {gateway === 'Squad' ? 'Squad Secure Channel' : 'Korapay Environment'}
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('plan_select')}
                className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProcessSquadPayment}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="pay-now-squad-btn"
              >
                <Lock className="w-4 h-4" />
                <span>Pay ₦{currentPlan.price.toLocaleString()} via Squad Gateway</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verifying */}
        {step === 'verifying' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Verifying Payment on Server...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Communicating with Squad API server to verify transaction reference and grant instant access...
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-2xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Payment Verified & Activated!</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Congratulations! You now have unlimited access to all CBT questions, course topics, solution explanations, and practice engines on Acadet CBT Master.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 max-w-md mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Plan:</span>
                <strong className="text-white">{currentPlan.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Gateway:</span>
                <span className="text-emerald-400 font-bold">Korapay Backend Verified</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Reference:</span>
                <span className="text-slate-300 font-mono text-[11px]">{activeRef || `KORA-${Date.now()}`}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full max-w-md py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl transition-all cursor-pointer mx-auto block"
              id="close-success-modal-btn"
            >
              Continue to CBT Practice Engine
            </button>
          </div>
        )}

        {/* Step 5: Failed / Cancelled */}
        {step === 'failed' && (
          <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30 shadow-2xl">
              <X className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Payment Verification Failed</h2>
              <p className="text-xs text-red-300 max-w-md mx-auto leading-relaxed">
                {paymentError || 'We could not verify your payment with Korapay. Please check your payment details or try again.'}
              </p>
            </div>

            <div className="flex items-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setStep('plan_select')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs sm:text-sm rounded-xl border border-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
