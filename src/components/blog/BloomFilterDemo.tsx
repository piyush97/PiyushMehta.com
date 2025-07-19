import React, { useState } from 'react';

interface BloomFilterDemoProps {}

interface BloomFilterState {
  bits: boolean[];
  size: number;
  items: string[];
}

function simpleHash(str: string, seed: number, size: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) % size;
  }
  return Math.abs(hash);
}

export const BloomFilterDemo: React.FC<BloomFilterDemoProps> = () => {
  const [filter, setFilter] = useState<BloomFilterState>({
    bits: new Array(8).fill(false),
    size: 8,
    items: [],
  });

  const [inputValue, setInputValue] = useState('');
  const [checkValue, setCheckValue] = useState('');
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const addItem = (item: string) => {
    if (!item.trim()) return;

    const newBits = [...filter.bits];
    const hash1 = simpleHash(item, 1, filter.size);
    const hash2 = simpleHash(item, 2, filter.size);
    const hash3 = simpleHash(item, 3, filter.size);

    newBits[hash1] = true;
    newBits[hash2] = true;
    newBits[hash3] = true;

    setFilter({
      ...filter,
      bits: newBits,
      items: [...filter.items, item],
    });
    setInputValue('');
  };

  const checkItem = (item: string) => {
    if (!item.trim()) return;

    const hash1 = simpleHash(item, 1, filter.size);
    const hash2 = simpleHash(item, 2, filter.size);
    const hash3 = simpleHash(item, 3, filter.size);

    const exists = filter.bits[hash1] && filter.bits[hash2] && filter.bits[hash3];
    const actuallyExists = filter.items.includes(item);

    if (!exists) {
      setCheckResult(`❌ "${item}" is DEFINITELY NOT in the filter (100% accurate)`);
    } else if (actuallyExists) {
      setCheckResult(`✅ "${item}" MIGHT be in the filter (and it actually is!)`);
    } else {
      setCheckResult(
        `⚠️ "${item}" MIGHT be in the filter (FALSE POSITIVE - it's not actually there!)`
      );
    }
  };

  const reset = () => {
    setFilter({
      bits: new Array(8).fill(false),
      size: 8,
      items: [],
    });
    setCheckResult(null);
  };

  const presetItems = ['netflix', 'google', 'instagram'];

  return (
    <div className="bg-gradient-card border border-card-border p-6 rounded-lg my-8 shadow-card">
      <h3 className="text-xl font-bold mb-4 text-text-primary">🧪 Interactive Bloom Filter Demo</h3>

      {/* Bit Array Visualization */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-text-primary">Bit Array (8 bits):</h4>
        <div className="flex gap-2 mb-2">
          {filter.bits.map((bit, index) => (
            <div
              key={`bit-${index}-${bit ? '1' : '0'}`}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                bit ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              {bit ? '1' : '0'}
            </div>
          ))}
        </div>
        <div className="flex gap-2 text-sm text-text-secondary">
          {filter.bits.map((_, index) => (
            <div key={`bit-position-${index}-${filter.bits.length}`} className="w-12 text-center">
              {index}
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Section */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-text-primary">Add Item to Filter:</h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem(inputValue)}
            placeholder="Enter a word (e.g., 'username123')"
            className="flex-1 p-2 border border-card-border rounded bg-light-800 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <button type="button" onClick={() => addItem(inputValue)} className="btn-primary">
            Add
          </button>
        </div>
        <div className="flex gap-2">
          {presetItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addItem(item)}
              className="btn-secondary text-sm px-3 py-1"
            >
              Add "{item}"
            </button>
          ))}
        </div>
      </div>

      {/* Check Item Section */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-text-primary">Check if Item Exists:</h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={checkValue}
            onChange={(e) => setCheckValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkItem(checkValue)}
            placeholder="Check if item exists"
            className="flex-1 p-2 border border-card-border rounded bg-light-800 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <button type="button" onClick={() => checkItem(checkValue)} className="btn-primary">
            Check
          </button>
        </div>
        {checkResult && (
          <div className="p-3 bg-light-700 border border-card-border rounded">
            <p className="text-text-primary">{checkResult}</p>
          </div>
        )}
      </div>

      {/* Current Items */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-text-primary">
          Items in Filter ({filter.items.length}):
        </h4>
        <div className="flex flex-wrap gap-2">
          {filter.items.map((item, _index) => (
            <span
              key={`item-${item}-${item.length}`}
              className="bg-accent/20 text-accent px-2 py-1 rounded text-sm"
            >
              {item}
            </span>
          ))}
          {filter.items.length === 0 && (
            <span className="text-text-secondary italic">No items added yet</span>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <button
        type="button"
        onClick={reset}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors duration-200"
      >
        Reset Filter
      </button>

      {/* Explanation */}
      <div className="mt-4 p-4 bg-light-700 border border-card-border rounded">
        <h5 className="font-semibold text-accent mb-2">How it works:</h5>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• Each item gets hashed to 3 different positions</li>
          <li>• Those positions are set to 1 in the bit array</li>
          <li>• To check: if ALL 3 positions are 1, item "might" exist</li>
          <li>• If ANY position is 0, item "definitely doesn't" exist</li>
        </ul>
      </div>
    </div>
  );
};
