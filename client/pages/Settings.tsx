import React, { useState, useEffect } from 'react';
import { subscribeToCollection, setDocument } from '../services/firestore';

const Settings: React.FC = () => {
    const [partners, setPartners] = useState<string[]>(['', '', '', '']);
    const [partnerDetails, setPartnerDetails] = useState<Record<string, { phone: string; email: string }>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToCollection('settings', (data) => {
            const partnerDoc = data.find(d => d.id === 'partners');
            if (partnerDoc && partnerDoc.list) {
                setPartners(partnerDoc.list);
                setPartnerDetails(partnerDoc.details || {});
            } else {
                // Default if not created yet
                setPartners(['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4']);
                setPartnerDetails({});
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handlePartnerChange = (index: number, value: string) => {
        const newPartners = [...partners];
        const oldName = newPartners[index];
        newPartners[index] = value;
        setPartners(newPartners);

        // Rename key in details map if they rename the partner
        if (oldName && oldName !== value && partnerDetails[oldName]) {
            setPartnerDetails(prev => {
                const newDetails = { ...prev };
                newDetails[value] = newDetails[oldName];
                delete newDetails[oldName];
                return newDetails;
            });
        }
    };

    const handleDetailChange = (name: string, field: 'phone' | 'email', value: string) => {
        if (!name) return;
        setPartnerDetails(prev => ({
            ...prev,
            [name]: {
                ...(prev[name] || { phone: '', email: '' }),
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        // Validate all 4 fields are non-empty
        if (partners.some(p => !p.trim())) {
            setSaveMessage({ type: 'error', text: 'All 4 partner names must be filled out.' });
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            await setDocument('settings', 'partners', {
                list: partners,
                details: partnerDetails
            });
            setSaveMessage({ type: 'success', text: 'Partner names updated successfully!' });

            setTimeout(() => {
                setSaveMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Failed to save partners', error);
            setSaveMessage({ type: 'error', text: 'Failed to update partner names.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="text-foreground p-8">Loading Settings...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '0ms' }}>
                <h2 className="text-2xl font-bold leading-7 text-foreground">Application <span className="text-muted font-normal">Settings</span></h2>
                <p className="mt-1 text-sm text-muted">Manage global configurations for BizTrack Gold.</p>
            </div>

            <div className="bg-background-surface border border-border-color rounded-lg shadow-lg overflow-hidden max-w-3xl animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '100ms' }}>
                <div className="p-6 border-b border-border-color flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-foreground flex items-center">
                            <span className="material-icons text-primary mr-2">group</span>
                            Manage Partners
                        </h3>
                        <p className="text-sm text-muted mt-1">
                            These names will be dynamically updated across the Personal Expenses and Raw Materials trackers.
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {partners.map((partner, index) => (
                            <div key={`partner-card-${index}`} className="bg-background-surface p-5 rounded-lg border border-border-color space-y-4 shadow-md transition-all duration-300 hover:border-border-color hover:shadow-lg">
                                <h4 className="text-foreground-muted font-semibold mb-3 flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs mr-2 font-bold">{index + 1}</div>
                                    Partner Settings
                                </h4>
                                <div>
                                    <label className="block text-xs font-medium text-primary mb-1">Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-icons text-muted text-sm">person</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={partner}
                                            onChange={(e) => handlePartnerChange(index, e.target.value)}
                                            className="block w-full pl-10 bg-background-base border border-border-color rounded-md py-2.5 text-foreground focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                            placeholder={`Partner ${index + 1} Name`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-primary mb-1">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-icons text-muted text-sm">phone</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={partnerDetails[partner]?.phone || ''}
                                            onChange={(e) => handleDetailChange(partner, 'phone', e.target.value)}
                                            className="block w-full pl-10 bg-background-base border border-border-color rounded-md py-2.5 text-foreground focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 transition-colors"
                                            placeholder="e.g. +91 98765 43210"
                                            disabled={!partner.trim()}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-primary mb-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-icons text-muted text-sm">email</span>
                                        </div>
                                        <input
                                            type="email"
                                            value={partnerDetails[partner]?.email || ''}
                                            onChange={(e) => handleDetailChange(partner, 'email', e.target.value)}
                                            className="block w-full pl-10 bg-background-base border border-border-color rounded-md py-2.5 text-foreground focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 transition-colors"
                                            placeholder="e.g. contact@domain.com"
                                            disabled={!partner.trim()}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border-color">
                        {saveMessage && (
                            <div className={`text-sm px-4 py-2 rounded-md ${saveMessage.type === 'success'
                                ? 'bg-green-900/20 text-green-400 border border-green-800'
                                : 'bg-red-900/20 text-red-400 border border-red-800'
                                }`}>
                                {saveMessage.text}
                            </div>
                        )}
                        {!saveMessage && <div />} {/* Spacer */}

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-2.5 px-6 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm disabled:opacity-50 flex items-center"
                        >
                            {isSaving ? (
                                <span className="material-icons animate-spin mr-2">refresh</span>
                            ) : (
                                <span className="material-icons mr-2 text-sm">save</span>
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
