import React from 'react';
import { useI18n } from '../../common/i18n';

type NotionPageItem = {
  id: string,
  icon?: string,
  kind?: "database",
  title?: string,
  url?: string
}

type NotionLocationPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  pageItems: NotionPageItem[];
  onConfirm: (selectedItemId: string | null) => void;
};

const NotionLocationPicker: React.FC<NotionLocationPickerProps> = ({
  isOpen,
  onClose,
  pageItems,
  onConfirm,
}) => {
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const { t } = useI18n();

  const handleConfirm = () => {
    onConfirm(selectedItem);
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-100 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {t('select_location')}
        </h3>
        
        <div className="space-y-3 mb-4 h-64 overflow-y-auto">
          {pageItems.map((item) => (
            <div key={item.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                id={item.id}
                name="notionPage"
                value={item.id}
                checked={selectedItem === item.id}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="mr-3"
              />
              <label htmlFor={item.id} className="flex-1 cursor-pointer">
                <div className="flex items-center">
                  {item.icon && (
                    <img src={item.icon} alt="" className="w-5 h-5 mr-2" />
                  )}
                  <span className="text-gray-900 dark:text-gray-100">
                    {item.title || '未命名数据库'}
                  </span>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn btn-secondary px-4"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary px-4"
            disabled={!selectedItem}
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotionLocationPicker;