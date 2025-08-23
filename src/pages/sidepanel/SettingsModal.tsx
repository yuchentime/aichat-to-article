import React, { useEffect, useState } from 'react';
import { encrypt, decrypt } from '../../lib/crypto';
import { useI18n, normalizeLang } from '../../lib/i18n';
import { notionConfigStore } from '../../lib/storage';

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
    { value: 'custom', label: 'custom' },
];

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [config, setConfig] = useState<ApiConfig>({
        provider: 'grok',
        apiKey: '',
        model: '',
        baseUrl: '',
        currentUsing: false,
    });
    const [notionConfig, setNotionConfig] = useState({
        apiKey: '',
        databaseId: '',
        isConfigured: false
    });
    const [activeTab, setActiveTab] = useState<'api' | 'notion'>('api');
    const { t, lang, setLanguage } = useI18n();

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

            // Load Notion configuration
            const notionConfig = await notionConfigStore.get();
            setNotionConfig(notionConfig);
        })();
    }, []);

    const switchLanguage = (newLang: 'en' | 'zh_CN' | 'zh_TW') => {
        setLanguage(newLang);
        chrome.storage.local.set({ language: newLang });
    }

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
        
        // Save Notion configuration
        const encryptedNotionKey = notionConfig.apiKey ? await encrypt(notionConfig.apiKey) : '';
        await notionConfigStore.set({
            ...notionConfig,
            apiKey: encryptedNotionKey,
            isConfigured: !!notionConfig.apiKey && !!notionConfig.databaseId
        });
        
        onClose();
    };

    return (
      <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
        <div className="modal-content w-full max-w-md">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('settings_title')}
            </h2>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'api'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('api')}
              >
                AI 设置
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'notion'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('notion')}
              >
                Notion 设置
              </button>
            </div>
          </div>
  
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'api' ? (
              <>
                {/* Language Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    {t('language_label')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('select_language')}
                      </label>
                      <select
                        className="input w-full"
                        value={lang}
                        onChange={(e) => switchLanguage(e.target.value as any)}
                      >
                        <option value="en">{t('language_en')}</option>
                        <option value="zh_CN">{t('language_zh_CN')}</option>
                        <option value="zh_TW">{t('language_zh_TW')}</option>
                      </select>
                    </div>
                  </div>
                </div>
      
                {/* API Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t('model_settings')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('provider_label')}
                      </label>
                      <select
                        className="input w-full"
                        value={config.provider}
                        onChange={(e) => {
                          void handleProviderChange(e.target.value as ApiConfig['provider']);
                        }}
                      >
                        {providers.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.value === 'custom' ? t('provider_custom') : p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('model_label')}
                      </label>
                      <input
                        className="input w-full"
                        placeholder="例如: gpt-4, gemini-pro"
                        value={config.model}
                        onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('api_key_label')}
                      </label>
                      <input
                        className="input w-full"
                        type="password"
                        placeholder="输入您的API密钥"
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      />
                    </div>
                    
                    {config.provider === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('base_url_label')}
                        </label>
                        <input
                          className="input w-full"
                          placeholder={t('base_url_placeholder')}
                          value={config.baseUrl}
                          onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Notion Settings */
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Notion 配置
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notion API 密钥
                    </label>
                    <input
                      className="input w-full"
                      type="password"
                      placeholder="输入您的 Notion API 密钥"
                      value={notionConfig.apiKey}
                      onChange={(e) => setNotionConfig({ ...notionConfig, apiKey: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      在 Notion 开发者设置中创建集成并获取 API 密钥
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      数据库 ID
                    </label>
                    <input
                      className="input w-full"
                      placeholder="输入您的 Notion 数据库 ID"
                      value={notionConfig.databaseId}
                      onChange={(e) => setNotionConfig({ ...notionConfig, databaseId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      分享数据库到您的集成并复制数据库 ID
                    </p>
                  </div>
                  
                  {notionConfig.isConfigured && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-800 dark:text-green-200">
                          Notion 配置已完成
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
  
          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              className="btn btn-secondary px-6"
              onClick={onClose}
            >
              {t('cancel_btn')}
            </button>
            <button
              className="btn btn-primary px-6"
              onClick={handleSave}
            >
              {t('save_btn')}
            </button>
          </div>
        </div>
      </div>
    );
};

export default SettingsModal;

