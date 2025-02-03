import React, { useState, useEffect } from 'react';
import { FileUp as FileUpload } from 'lucide-react';
import { Download, Search, Plus, Edit2, Trash2, Package, Image } from 'lucide-react';

interface Item {
  name: string;
  label: string;
  weight: number;
  type: string;
  image: string;
  unique: boolean;
  useable: boolean;
  shouldClose: boolean;
  combinable: any;
  description: string;
  category?: string;
}

function App() {
  const [items, setItems] = useState<Record<string, Item>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);

  // Import items.lua file
  const importItems = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const itemsStr = text.match(/QBShared.Items = {([\s\S]*?)};/)?.[1] || '';
        const itemsObj = parseLuaTable(itemsStr);
        setItems(itemsObj);
        
        const cats = new Set(Object.values(itemsObj).map(item => item.type));
        setCategories(Array.from(cats));
      } catch (err) {
        console.error('Failed to parse items file:', err);
      }
    };
    reader.readAsText(file);
  };

  const exportItems = () => {
    const luaTable = `QBShared = QBShared or {};\nQBShared.Items = ${convertToLuaTable(items)};`;
    
    const blob = new Blob([luaTable], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items.lua';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addItem = () => {
    const defaultLabel = 'New Item';
    const defaultName = defaultLabel.toLowerCase().replace(/\s+/g, '_');
    const timestamp = Date.now();
    const newItemName = `${defaultName}_${timestamp}`;
    
    const newItem: Item = {
      name: defaultName,
      label: defaultLabel,
      weight: 0,
      type: categories[0] || 'item',
      image: 'placeholder.png',
      unique: false,
      useable: false,
      shouldClose: true,
      combinable: null,
      description: ''
    };

    setItems(prev => {
      const newItems = { [newItemName]: newItem };
      Object.entries(prev).forEach(([key, value]) => {
        newItems[key] = value;
      });
      return newItems;
    });
    setIsAddingNewItem(true);
    setEditingItem(newItemName);
  };

  const deleteItem = (name: string) => {
    const newItems = { ...items };
    delete newItems[name];
    setItems(newItems);
  };

  const filteredItems = Object.entries(items).filter(([name, item]) => {
    if (!item) return false;
    
    try {
      const searchString = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        name.toLowerCase().includes(searchString) ||
        (item.label || '').toLowerCase().includes(searchString) ||
        (item.description || '').toLowerCase().includes(searchString);
      const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
      return matchesSearch && matchesCategory;
    } catch (error) {
      console.error('Error filtering item:', error);
      return false;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <Package size={32} className="text-blue-500" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Items Manager
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <label className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg transition-transform hover:scale-105">
              <FileUpload size={20} />
              Import items.lua
              <input type="file" accept=".lua" onChange={importItems} className="hidden" />
            </label>

            <button
              onClick={addItem}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg transition-transform hover:scale-105"
            >
              <Plus size={20} />
              Add New Item
            </button>
            
            <button 
              onClick={exportItems}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg transition-transform hover:scale-105"
            >
              <Download size={20} />
              Export items.lua
            </button>
          </div>

          {isAddingNewItem && editingItem && items[editingItem] && (
            <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Add New Item</h2>
              <ItemEditor
                item={items[editingItem]}
                onSave={(updatedItem) => {
                  const newName = updatedItem.label.toLowerCase().replace(/\s+/g, '_');
                  const updatedItemWithName = {
                    ...updatedItem,
                    name: newName
                  };
                  setItems(prev => {
                    const newItems = { [newName]: updatedItemWithName };
                    Object.entries(prev).forEach(([key, value]) => {
                      if (key !== editingItem) {
                        newItems[key] = value;
                      }
                    });
                    return newItems;
                  });
                  setEditingItem(null);
                  setIsAddingNewItem(false);
                }}
                onCancel={() => {
                  const newItems = { ...items };
                  delete newItems[editingItem];
                  setItems(newItems);
                  setEditingItem(null);
                  setIsAddingNewItem(false);
                }}
                categories={categories}
              />
            </div>
          )}

          <div className="search-container flex flex-wrap gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option key="category-all" value="all">All Categories</option>
              {categories.map(cat => (
                <option key={`category-${cat}`} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="item-grid">
            {filteredItems.map(([name, item], index) => (
              <div 
                key={name} 
                className="item-card bg-white border border-gray-100 rounded-xl p-6 hover:border-blue-200 shadow-sm"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {editingItem === name && !isAddingNewItem ? (
                  <ItemEditor
                    item={item}
                    onSave={(updatedItem) => {
                      const newName = updatedItem.label.toLowerCase().replace(/\s+/g, '_');
                      const updatedItemWithName = {
                        ...updatedItem,
                        name: newName
                      };
                      setItems(prev => {
                        const newItems = { [newName]: updatedItemWithName };
                        Object.entries(prev).forEach(([key, value]) => {
                          if (key !== name) {
                            newItems[key] = value;
                          }
                        });
                        return newItems;
                      });
                      setEditingItem(null);
                    }}
                    onCancel={() => setEditingItem(null)}
                    categories={categories}
                  />
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">{item.label}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem(name)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteItem(name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{item.description || 'No description'}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Name:</span> {item.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Type:</span> 
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{item.type}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Weight:</span> {item.weight}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Image:</span> 
                        <span className="flex items-center gap-1">
                          <Image size={14} className="text-gray-400" />
                          {item.image}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {item.unique && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Unique</span>
                      )}
                      {item.useable && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Useable</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemEditor({ item, onSave, onCancel, categories }: {
  item: Item;
  onSave: (item: Item) => void;
  onCancel: () => void;
  categories: string[];
}) {
  const [editedItem, setEditedItem] = useState(item);

  return (
    <div className="space-y-4 fade-enter">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={editedItem.label}
            onChange={(e) => setEditedItem({...editedItem, label: e.target.value})}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
          <input
            type="number"
            value={editedItem.weight}
            onChange={(e) => setEditedItem({...editedItem, weight: Number(e.target.value)})}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={editedItem.type}
            onChange={(e) => setEditedItem({...editedItem, type: e.target.value})}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={`editor-category-${cat}`} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <div className="relative">
            <Image size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={editedItem.image}
              onChange={(e) => setEditedItem({...editedItem, image: e.target.value})}
              placeholder="Enter image filename"
              className="w-full pl-10 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editedItem.description}
            onChange={(e) => setEditedItem({...editedItem, description: e.target.value})}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editedItem.unique}
            onChange={(e) => setEditedItem({...editedItem, unique: e.target.checked})}
            className="rounded text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Unique</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editedItem.useable}
            onChange={(e) => setEditedItem({...editedItem, useable: e.target.checked})}
            className="rounded text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Useable</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editedItem.shouldClose}
            onChange={(e) => setEditedItem({...editedItem, shouldClose: e.target.checked})}
            className="rounded text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Should Close</span>
        </label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(editedItem)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function parseLuaTable(luaStr: string): Record<string, Item> {
  const items: Record<string, Item> = {};
  const itemRegex = /\s*\[?["']?(\w+)["']?\]?\s*=\s*{([^}]+)}/g;
  let match;

  while ((match = itemRegex.exec(luaStr)) !== null) {
    const [_, name, props] = match;
    const item: any = {};
    
    const propRegex = /\[?["']?(\w+)["']?\]?\s*=\s*([^,}]+)/g;
    let propMatch;
    
    while ((propMatch = propRegex.exec(props)) !== null) {
      const [__, key, value] = propMatch;
      if (key && value) {
        try {
          if (value.trim() === 'nil') {
            item[key] = null;
          } else if (value.trim() === 'true' || value.trim() === 'false') {
            item[key] = value.trim() === 'true';
          } else if (!isNaN(Number(value.trim()))) {
            item[key] = Number(value.trim());
          } else {
            item[key] = value.trim().replace(/['"]/g, '');
          }
        } catch {
          item[key] = value.trim().replace(/['"]/g, '');
        }
      }
    }

    items[name] = item as Item;
  }

  return items;
}

function convertToLuaTable(items: Record<string, Item>): string {
  return `{
    ${Object.entries(items).map(([name, item]) => `
      ["${name}"] = {
        name = "${item.name}",
        label = "${item.label}",
        weight = ${item.weight},
        type = "${item.type}",
        image = "${item.image}",
        unique = ${item.unique},
        useable = ${item.useable},
        shouldClose = ${item.shouldClose},
        combinable = ${item.combinable ? JSON.stringify(item.combinable) : 'nil'},
        description = "${item.description}"
      }`).join(',\n')}
  }`;
}

export default App;