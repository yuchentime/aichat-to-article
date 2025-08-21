import React, { useEffect, useState } from 'react';
import { encrypt, decrypt } from '../../lib/crypto';

interface ApiConfig {
    provider: 'grok' | 'chatgpt' | 'gemini' | 'custom';
    apiKey: string;
    model: string;
    baseUrl: string;
    currentUsing?: boolean;
}

const providers = [
    { value: 'grok', label: 'Grok' },
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'custom', label: '自定义' },
];

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [config, setConfig] = useState<ApiConfig>({
        provider: 'grok',
        apiKey: '',
        model: '',
        baseUrl: '',
        currentUsing: false,
    });

    useEffect(() => {
        (async () => {
            const { apiConfig } = await chrome.storage.local.get('apiConfig');
            let configs: ApiConfig[] = [];
            if (Array.isArray(apiConfig)) configs = apiConfig;
            else if (apiConfig) configs = [apiConfig];
            if (configs.length) {
                const first = configs[0];
                const apiKey = first.apiKey ? await decrypt(first.apiKey) : '';
                setConfig({
                    provider: first.provider,
                    apiKey,
                    model: first.model,
                    baseUrl: (first as any).baseUrl ?? '',
                    currentUsing: first.currentUsing ?? false,
                });
            }
        })();
    }, []);

    const handleProviderChange = async (value: ApiConfig['provider']) => {
        // Immediately reflect selection to avoid async lag/race causing dropdown to revert
        setConfig((prev) => ({
            ...prev,
            provider: value,
        }));

        try {
            const { apiConfig } = await chrome.storage.local.get('apiConfig');
            let configs: ApiConfig[] = [];
            if (Array.isArray(apiConfig)) configs = apiConfig;
            else if (apiConfig) configs = [apiConfig];

            const existed = configs.find((c) => c.provider === value);
            if (existed) {
                const apiKey = existed.apiKey ? await decrypt(existed.apiKey) : '';
                setConfig((prev) => ({
                    ...prev,
                    provider: value,
                    apiKey,
                    model: existed.model || '',
                    baseUrl: (existed as any).baseUrl ?? '',
                    currentUsing: existed.currentUsing ?? false,
                }));
            } else {
                setConfig((prev) => ({
                    ...prev,
                    provider: value,
                    apiKey: '',
                    model: '',
                    baseUrl: '',
                    currentUsing: false,
                }));
            }
        } catch {
            // Keep at least the selected provider
            setConfig((prev) => ({
                ...prev,
                provider: value,
            }));
        }
    };

    const handleSave = async () => {
        const encrypted = config.apiKey ? await encrypt(config.apiKey) : '';
        const toSave = { ...config, apiKey: encrypted };
        const { apiConfig } = await chrome.storage.local.get('apiConfig');
        let configs: ApiConfig[] = [];
        if (Array.isArray(apiConfig)) configs = apiConfig;
        else if (apiConfig) configs = [apiConfig];
        const index = configs.findIndex((c) => c.provider === config.provider);
        if (index >= 0) configs[index] = { ...configs[index], ...toSave };
        else configs.push(toSave);
        if (!configs.some((c) => c.currentUsing)) {
            configs[0].currentUsing = true;
        }
        await chrome.storage.local.set({ apiConfig: configs });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded w-80 space-y-4">
                <h2 className="text-lg font-semibold">模型设置</h2>
                <div className="space-y-2">
                    <label className="block text-sm">服务提供商</label>
                    <select
                        className="w-full border p-1 dark:bg-gray-700"
                        value={config.provider}
                        onChange={(e) => {
                            void handleProviderChange(e.target.value as ApiConfig['provider']);
                        }}
                    >
                        {providers.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm">模型</label>
                    <input
                        className="w-full border p-1 dark:bg-gray-700"
                        value={config.model}
                        onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm">API Key</label>
                    <input
                        className="w-full border p-1 dark:bg-gray-700"
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    />
                </div>
                {config.provider === 'custom' && (
                    <div className="space-y-2">
                        <label className="block text-sm">Base URL</label>
                        <input
                            className="w-full border p-1 dark:bg-gray-700"
                            placeholder="https://your-api.example.com"
                            value={config.baseUrl}
                            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                        />
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <button className="px-3 py-1 text-sm" onClick={onClose}>
                        取消
                    </button>
                    <button
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
                        onClick={handleSave}
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;

