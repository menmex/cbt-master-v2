import React, { useState, useEffect } from 'react';
import { UserProfile, SubscriptionPlan, PaymentTransaction } from '../types';
import { StorageService } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import {
  X,
  CheckCircle2,
  Zap,
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Lock,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Smartphone,
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
      'No card required for free trial',
    ],
  };

  const displayPlans = plans.some((p) => p.price === 0 || p.id === 'plan-free')
    ? plans
    : [freePlan, ...plans];

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    displayPlans.find((p) => p.popular)?.id || displayPlans[1]?.id || displayPlans[0]?.id
  );
  const [step, setStep] = useState<'plan_select' | 'verifying_squad' | 'success'>('plan_select');
  const [activeRef, setActiveRef] = useState<string>('');

  // Squad Gateway State
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [squadError, setSquadError] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [squadTxData, setSquadTxData] = useState<{
    reference: string;
    checkoutUrl?: string;
    transferDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      reference: string;
    };
  } | null>(null);

  // Tab selection in verification step
  const [activeTab, setActiveTab] = useState<'transfer' | 'card'>('transfer');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep('plan_select');
      setSquadError(null);
      setVerifyMsg(null);
      setIsInitializing(false);
      setIsVerifying(false);
      setSquadTxData(null);
      setActiveTab('transfer');
    }
  }, [isOpen]);

  // Automated Payment Verification Polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isOpen && step === 'verifying_squad' && squadTxData?.reference) {
      // Immediate initial verification check
      handleVerifySquad(true);

      // Poll every 4 seconds for automatic verification
      intervalId = setInterval(() => {
        handleVerifySquad(true);
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, step, squadTxData?.reference]);

  if (!isOpen) return null;

  const currentPlan = displayPlans.find((p) => p.id === selectedPlanId) || displayPlans[0];
  const isFreeTrialSelected = currentPlan.price === 0 || currentPlan.id === 'plan-free';

  const handleCopy = (text: string, fieldName: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Free Trial Activation Only (0 NGN)
  const handleFreeTrialActivation = () => {
    const updatedUser: UserProfile = {
      ...user,
      subscription: {
        isPremium: false,
        plan: freePlan.name,
        startDate: new Date().toISOString(),
        expiryDate: new Date().toISOString(),
        questionsAttemptedCount: user.subscription?.questionsAttemptedCount || 0,
        freeLimit: 30,
      },
    };

    StorageService.saveUser(updatedUser);
    if (onUpdateUser) onUpdateUser(updatedUser);

    const ref = `FREE_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setActiveRef(ref);

    const transaction: PaymentTransaction = {
      id: `tx-free-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userUsername: user.username || '',
      userEmail: user.email,
      reference: ref,
      gateway: 'Free Access',
      amount: 0,
      planName: freePlan.name,
      date: new Date().toISOString(),
      paymentDate: new Date().toISOString(),
      expiryDate: new Date().toISOString(),
      status: 'Successful',
      paymentMethod: 'Free Access',
    };

    StorageService.saveTransaction(transaction);
    setStep('success');
    onPaymentSuccess(freePlan, transaction);
  };

  // Squad Online Payment Initialization for Premium Plans
  const handleSquadCheckout = async () => {
    setSquadError(null);
    setVerifyMsg(null);
    setIsInitializing(true);

    const effectiveUserId = user?.id || (user as any)?.uid || 'usr-student';
    const effectiveUserEmail =
      user?.email && user.email.trim()
        ? user.email.trim()
        : user?.username
        ? `${user.username}@acadet.cbt`
        : `student-${user?.id || Date.now()}@acadet.cbt`;

    try {
      const payload = {
        amount: currentPlan.price,
        email: effectiveUserEmail,
        userEmail: effectiveUserEmail,
        userId: effectiveUserId,
        userName: user?.name || 'Student User',
        userUsername: user?.username || '',
        planId: currentPlan.id,
        planName: currentPlan.name,
      };

      const res = await ApiClient.createPaymentLink(payload);

      if (res && res.success && res.reference) {
        const checkoutUrl = res.checkoutUrl || res.paymentLink;
        setSquadTxData({
          reference: res.reference,
          checkoutUrl,
          transferDetails: res.transferDetails || null,
        });

        // Open Squad checkout URL in a new window/tab if available
        if (checkoutUrl) {
          try {
            window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
          } catch {
            // Popup blocker fallback
          }
        }

        setStep('verifying_squad');
      } else {
        setSquadError(
          res?.error || 'Could not connect to Squad Payment Gateway. Please try again.'
        );
      }
    } catch (err: any) {
      setSquadError(
        err?.message || 'Network error connecting to Squad Payment Gateway. Please try again.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  // Verify Squad Payment Status
  const handleVerifySquad = async (silent = false) => {
    if (!squadTxData?.reference) return;

    if (!silent) {
      setIsVerifying(true);
      setVerifyMsg(null);
    }

    const effectiveUserId = user?.id || (user as any)?.uid || 'usr-student';
    const effectiveUserEmail =
      user?.email && user.email.trim()
        ? user.email.trim()
        : user?.username
        ? `${user.username}@acadet.cbt`
        : `student-${user?.id || Date.now()}@acadet.cbt`;

    try {
      const res = await ApiClient.verifyPayment({
        reference: squadTxData.reference,
        userId: effectiveUserId,
        email: effectiveUserEmail,
        planId: currentPlan.id,
      });

      setLastCheckedTime(new Date().toLocaleTimeString());

      if (res && res.success) {
        const is14d = currentPlan.id === 'plan-14d' || currentPlan.price === 800;
        const is90d = currentPlan.id === 'plan-90d' || currentPlan.price === 3500;
        const durationDays = is14d ? 14 : is90d ? 90 : 30;
        const expiryDate = new Date(Date.now() + durationDays * 86400000).toISOString();

        const updatedUser: UserProfile = {
          ...user,
          subscription: {
            isPremium: true,
            plan: currentPlan.name,
            startDate: new Date().toISOString(),
            expiryDate,
            questionsAttemptedCount: user.subscription?.questionsAttemptedCount || 0,
            freeLimit: 999999,
          },
        };

        StorageService.saveUser(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);

        setActiveRef(squadTxData.reference);

        const transaction: PaymentTransaction = {
          id: `tx-sq-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          userUsername: user.username || '',
          userEmail: user.email,
          reference: squadTxData.reference,
          gateway: 'Squad Co',
          amount: currentPlan.price,
          planName: currentPlan.name,
          date: new Date().toISOString(),
          paymentDate: new Date().toISOString(),
          expiryDate,
          status: 'Successful',
          paymentMethod: 'Squad Checkout (Card / Bank Transfer / USSD)',
        };

        StorageService.saveTransaction(transaction);
        setStep('success');
        onPaymentSuccess(currentPlan, transaction);
      } else {
        if (!silent) {
          setVerifyMsg(res?.error || 'Payment not confirmed on Squad yet. Complete payment via transfer or card, then click verify again.');
        }
      }
    } catch (err: any) {
      if (!silent) {
        setVerifyMsg(err?.message || 'Verification check failed. Please ensure payment was completed.');
      }
    } finally {
      if (!silent) {
        setIsVerifying(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="subscription-modal-wrapper">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-xl rounded-3xl shadow-2xl p-5 sm:p-7 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 mb-4 z-20" id="sub-modal-top-nav-bar">
          <button
            onClick={() => {
              if (step !== 'plan_select') {
                setStep('plan_select');
                setSquadError(null);
                setVerifyMsg(null);
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
            CBT Master Access Pass
          </span>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
            id="sub-modal-close-btn"
            title="Close"
          >
            <span>Close</span>
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
                <h2 className="text-2xl font-extrabold text-white mt-3">Choose Subscription Plan</h2>
                <p className="text-xs text-slate-400 mt-1">Pay via Bank Transfer or Debit Card with instant automatic verification.</p>
              </div>

              {/* Active Subscription Status Banner */}
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
                        alert("Your subscription has been cancelled.");
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}

              {/* Plans Grid */}
              <div className="space-y-3">
                {displayPlans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const isFree = p.price === 0 || p.id === 'plan-free';
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
                              Free Access
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {isFree
                            ? '30 Free practice questions with full CBT engine access.'
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

              {/* Payment Info Banner */}
              {!isFreeTrialSelected && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bank Transfer & Card Payment (Squad / GTBank)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Make payment via Bank App Transfer, Debit Card, or USSD code. Your payment is automatically verified in real-time.
                  </p>
                </div>
              )}

              {/* Squad Error Banner */}
              {squadError && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{squadError}</span>
                </div>
              )}

              {/* Action Button */}
              {isFreeTrialSelected ? (
                <button
                  onClick={handleFreeTrialActivation}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="activate-free-trial-btn"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Start Free Trial (30 Free Questions)</span>
                </button>
              ) : (
                <button
                  onClick={handleSquadCheckout}
                  disabled={isInitializing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  id="pay-squad-btn"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Initializing payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-emerald-200" />
                      <span>Pay with Squad (₦{currentPlan.price.toLocaleString()})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Step 2: Verifying & Payment Options */}
          {step === 'verifying_squad' && (
            <div className="py-2 space-y-5 animate-in fade-in">
              
              {/* Auto-Verification Live Banner */}
              <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <p className="font-extrabold text-emerald-300 text-xs">
                      ⚡ Auto-Verifying Payment
                    </p>
                    <p className="text-[11px] text-emerald-400/80">
                      Checking status automatically every 4s {lastCheckedTime ? `(Last checked: ${lastCheckedTime})` : ''}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    Live Engine
                  </span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'transfer'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Bank Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'card'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card / USSD Online</span>
                </button>
              </div>

              {/* Tab 1: Direct Bank Transfer Details */}
              {activeTab === 'transfer' && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-400" />
                        <span>Pay via Bank App Transfer</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {squadTxData?.transferDetails?.accountNumber
                          ? 'Transfer exact amount to the dedicated account below:'
                          : 'Complete payment on Squad Gateway using Bank Transfer, Card, or USSD:'}
                      </p>
                    </div>
                    <span className="text-lg font-black text-emerald-400">
                      ₦{currentPlan.price.toLocaleString()}
                    </span>
                  </div>

                  {squadTxData?.transferDetails?.accountNumber ? (
                    <div className="space-y-3 text-xs">
                      {/* Bank Name */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-400 font-semibold">Bank Name:</span>
                        <strong className="text-white font-bold">
                          {squadTxData.transferDetails.bankName || 'GTBank (Squad)'}
                        </strong>
                      </div>

                      {/* Account Number with Copy */}
                      <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Account Number
                          </span>
                          <span className="text-xl font-mono font-black text-amber-400 tracking-wider">
                            {squadTxData.transferDetails.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(squadTxData.transferDetails!.accountNumber, 'acc')
                          }
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {copiedField === 'acc' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Account Name */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-400 font-semibold">Account Name:</span>
                        <span className="text-white font-bold">
                          {squadTxData.transferDetails.accountName || `Acadet CBT - ${user?.name || 'Student'}`}
                        </span>
                      </div>

                      {/* Reference with Copy */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400 font-semibold">Payment Reference:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-amber-300 font-bold">
                            {squadTxData?.reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(squadTxData?.reference || '', 'ref')}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                            title="Copy Reference"
                          >
                            {copiedField === 'ref' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-3">
                      <p className="text-xs text-slate-300">
                        Click the button below to open Squad Gateway. Squad supports instant Bank Transfer, Debit Cards, and USSD:
                      </p>
                      {squadTxData?.checkoutUrl && (
                        <a
                          href={squadTxData.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Squad Secure Checkout</span>
                        </a>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono">
                        Ref: {squadTxData?.reference}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300/90 leading-relaxed">
                    💡 <strong>Automatic Verification:</strong> Complete payment on Squad, then click "Verify Payment Status" below to activate your Premium access!
                  </div>
                </div>
              )}

              {/* Tab 2: Online Card / USSD Payment */}
              {activeTab === 'card' && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-center">
                  <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30">
                    <CreditCard className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-white text-base">Pay via Squad Online Checkout</h4>
                    <p className="text-xs text-slate-400">
                      Supports Debit Cards (Mastercard, Visa, Verve) & USSD codes.
                    </p>
                  </div>

                  {squadTxData?.checkoutUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(squadTxData.checkoutUrl, '_blank', 'noopener,noreferrer')}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Squad Payment Gateway (Card / USSD)</span>
                    </button>
                  )}

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                    🔒 Complete your payment on the secure Squad Gateway page. Your subscription will automatically unlock as soon as payment is confirmed!
                  </div>
                </div>
              )}

              {/* Verification Feedback Banner */}
              {verifyMsg && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center gap-2 max-w-md mx-auto text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{verifyMsg}</span>
                </div>
              )}

              {/* Manual Verification Trigger Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleVerifySquad(false)}
                  disabled={isVerifying}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  id="verify-squad-status-btn"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking Payment Status with Squad...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Manual Verification (Check Now)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-2xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Subscription Activated!</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Congratulations! You now have full access to all CBT questions, course topics, solution explanations, and practice engines on Acadet CBT Master.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 max-w-md mx-auto text-xs">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Selected Plan:</span>
                  <strong className="text-white">{currentPlan.name}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Access Status:</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Activation Ref:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{activeRef || `ACT-${Date.now()}`}</span>
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
        </div>
      </div>
    </div>
  );
};

