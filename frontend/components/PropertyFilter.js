// frontend/components/PropertyFilter.js
import { useState } from "react";
import { PROPERTY_TYPES } from "../utils/constants";

export default function PropertyFilter({ properties, onFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const applyFilters = () => {
    let filtered = [...properties];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.location && p.location.toLowerCase().includes(term)) ||
          (p.seller && p.seller.toLowerCase().includes(term)) ||
          `property #${p.id}`.includes(term)
      );
    }

    if (minPrice) {
      filtered = filtered.filter(
        (p) => parseFloat(p.price) >= parseFloat(minPrice)
      );
    }
    if (maxPrice) {
      filtered = filtered.filter(
        (p) => parseFloat(p.price) <= parseFloat(maxPrice)
      );
    }

    if (propertyType) {
      filtered = filtered.filter((p) => p.propertyType === propertyType);
    }

    if (verifiedOnly) {
      filtered = filtered.filter((p) => p.governmentVerified);
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "newest":
        filtered.sort((a, b) => b.id - a.id);
        break;
      case "oldest":
        filtered.sort((a, b) => a.id - b.id);
        break;
      default:
        break;
    }

    onFilter(filtered);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setPropertyType("");
    setVerifiedOnly(false);
    setSortBy("newest");
    onFilter(properties);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-700">🔍 Search & Filter</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Name, location, or address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setTimeout(applyFilters, 100);
            }}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Min Price (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setTimeout(applyFilters, 100);
            }}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Max Price (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="100"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setTimeout(applyFilters, 100);
            }}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setTimeout(applyFilters, 100);
            }}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Type:</label>
          <select
            value={propertyType}
            onChange={(e) => {
              setPropertyType(e.target.value);
              setTimeout(applyFilters, 100);
            }}
            className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">All Types</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => {
              setVerifiedOnly(e.target.checked);
              setTimeout(applyFilters, 100);
            }}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-600">Verified Only</span>
        </label>

        <button
          onClick={applyFilters}
          className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}