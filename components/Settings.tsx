
import React, { useState, useEffect, useRef } from 'react';
import { Check, Camera, Lock, CreditCard, Shield, User, Bell, Loader2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsProps {
    userProfile: UserProfile;
    onSaveProfile: (profile: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ userProfile, onSaveProfile }) => {
    const [profile, setProfile] = useState(userProfile);
    const [isProcessingImg, setIsProcessingImg] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    
    // Persistent Local State for Notifications
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('arise_notifications_v2');
        return saved ? JSON.parse(saved) : { email: true, sms: false };
    });

    // Persistent Local State for Payment Form
    const [paymentInfo, setPaymentInfo] = useState(() => {
        const saved = localStorage.getItem('arise_payment_v2');
        return saved ? JSON.parse(saved) : {
            cardName: '',
            cardNumber: '',
            expiry: '',
            cvc: ''
        };
    });

    // Edit state for payment method - default to false if card exists (secure view), true if empty
    const [isEditingPayment, setIsEditingPayment] = useState(() => {
        const saved = localStorage.getItem('arise_payment_v2');
        const parsed = saved ? JSON.parse(saved) : {};
        return !parsed.cardNumber;
    });

    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync profile state if prop changes (from App.tsx persistence)
    useEffect(() => {
        setProfile(userProfile);
    }, [userProfile]);

    // Save Notifications when changed
    useEffect(() => {
        localStorage.setItem('arise_notifications_v2', JSON.stringify(notifications));
    }, [notifications]);

    // Save Payment Info when changed
    useEffect(() => {
        localStorage.setItem('arise_payment_v2', JSON.stringify(paymentInfo));
    }, [paymentInfo]);

    const handleSave = () => {
        try {
            onSaveProfile(profile);
            setSaveError(null);
            setIsSaved(true);
            
            // If payment info is valid, lock the view to secure mode
            if (paymentInfo.cardNumber) {
                setIsEditingPayment(false);
            }
            
            setTimeout(() => setIsSaved(false), 3000);
        } catch (e) {
            console.error("Save failed", e);
            setSaveError("Failed to save. Storage might be full.");
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImg(true);
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Increased to 600px to maintain high visual quality while ensuring fit in localStorage
                    const MAX_SIZE = 600; 
                    
                    let width = img.width;
                    let height = img.height;

                    // Maintain aspect ratio while resizing
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // High quality JPEG (0.95) to preserve details
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    
                    setProfile(prev => ({ ...prev, avatarUrl: compressedDataUrl }));
                    setIsProcessingImg(false);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="animate-fade-in space-y-6 max-w-5xl mx-auto pb-10">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: General & Notifications */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Information */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <User size={18} className="text-indigo-500" />
                                Profile Information
                            </h3>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group w-24 h-24">
                                        {isProcessingImg ? (
                                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center ring-4 ring-indigo-500/20">
                                                <Loader2 className="animate-spin text-indigo-500" size={24} />
                                            </div>
                                        ) : (
                                            <>
                                                <img 
                                                    src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.name}`} 
                                                    alt="Profile" 
                                                    className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/20 bg-slate-800"
                                                />
                                                <div 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                >
                                                    <Camera className="text-white" size={24} />
                                                </div>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                                        disabled={isProcessingImg}
                                    >
                                        {isProcessingImg ? 'Processing...' : 'Change Photo'}
                                    </button>
                                </div>

                                {/* Fields */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-white" 
                                            value={profile.name}
                                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-white" 
                                            value={profile.email}
                                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-white" 
                                            value={profile.phone}
                                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-400 mb-1">National Producer Number (NPN)</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-white" 
                                            value={profile.npn || ''}
                                            onChange={(e) => setProfile({...profile, npn: e.target.value})}
                                            placeholder="e.g. 1234567"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription & Billing */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                             <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <CreditCard size={18} className="text-indigo-500" />
                                Subscription & Billing
                            </h3>
                            
                            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 mb-6 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">Professional Plan</p>
                                    <p className="text-sm text-slate-500">$99.00 / month • Renews on Nov 1, 2024</p>
                                </div>
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold rounded-full">Active</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-white">Payment Method</h4>
                                    {isEditingPayment && paymentInfo.cardNumber && (
                                        <button 
                                            onClick={() => setIsEditingPayment(false)}
                                            className="text-xs text-slate-500 hover:text-slate-300"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                
                                {!isEditingPayment && paymentInfo.cardNumber ? (
                                    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-lg animate-fade-in">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-400">
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                                    <span className="text-slate-500 text-xs tracking-widest mt-1">•••• •••• ••••</span> 
                                                    {paymentInfo.cardNumber.slice(-4)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Expires {paymentInfo.expiry}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setIsEditingPayment(true)}
                                            className="text-sm text-indigo-400 font-medium hover:underline"
                                        >
                                            Update
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Cardholder Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="Name on Card"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white"
                                                value={paymentInfo.cardName}
                                                onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Card Number</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                <input 
                                                    type="text" 
                                                    placeholder="0000 0000 0000 0000"
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:border-indigo-500 outline-none text-white"
                                                    value={paymentInfo.cardNumber}
                                                    onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Expiry Date</label>
                                            <input 
                                                type="text" 
                                                placeholder="MM / YY"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white"
                                                value={paymentInfo.expiry}
                                                onChange={(e) => setPaymentInfo({...paymentInfo, expiry: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">CVC</label>
                                            <input 
                                                type="text" 
                                                placeholder="123"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white"
                                                value={paymentInfo.cvc}
                                                onChange={(e) => setPaymentInfo({...paymentInfo, cvc: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Security & Notifications */}
                <div className="space-y-6">
                     {/* Security */}
                     <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <Lock size={18} className="text-indigo-500" />
                                Security
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Current Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white" 
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white" 
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white" 
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                    />
                                </div>
                                <button className="w-full py-2 bg-slate-800 text-slate-300 font-medium rounded-lg text-sm hover:bg-slate-700 border border-slate-700">
                                    Update Password
                                </button>
                            </div>
                        </div>
                     </div>

                    {/* Notifications */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Bell size={18} className="text-indigo-500" />
                                Notifications
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Email Alerts</span>
                                    <div 
                                        onClick={() => setNotifications(n => ({...n, email: !n.email}))}
                                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.email ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications.email ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">SMS Alerts</span>
                                     <div 
                                        onClick={() => setNotifications(n => ({...n, sms: !n.sms}))}
                                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.sms ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                     >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications.sms ? 'right-1' : 'left-1'}`}></div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Sticky Footer for Save */}
             <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-white/5 shadow-lg flex justify-end items-center gap-4 z-20">
                {saveError && (
                    <span className="text-red-400 text-xs font-medium flex items-center gap-1 animate-pulse">
                        <AlertCircle size={16} /> {saveError}
                    </span>
                )}
                {isSaved && (
                    <span className="text-green-400 text-sm font-medium flex items-center gap-1 animate-fade-in">
                        <Check size={16} /> All changes saved
                    </span>
                )}
                <button 
                    onClick={handleSave}
                    disabled={isProcessingImg}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessingImg ? 'Processing...' : 'Save Changes'}
                </button>
             </div>
        </div>
    );
};

export default Settings;
