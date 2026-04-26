import { useEffect, useMemo, useState } from "react";

function getUniquePropertyTypes(properties = []) {
  const types = new Set();

  properties.forEach((property) => {
    if (property?.propertyType) {
      types.add(property.propertyType);
    }
  });

  return ["All Types", ...Array.from(types)];
}

function parsePrice(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export default function PropertyFilter({ properties = [], onFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const propertyTypes = useMemo(() => getUniquePropertyTypes(properties), [properties]);

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();

      result = result.filter((property) => {
        const searchableText = [
          property?.name,
          property?.location,
          property?.description,
          property?.propertyType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Property type
    if (selectedType !== "All Types") {
      result = result.filter(
        (property) => property?.propertyType === selectedType
      );
    }

    // Status
    if (statusFilter === "verified") {
      result = result.filter((property) => property?.governmentVerified);
    } else if (statusFilter === "unverified") {
      result = result.filter((property) => !property?.governmentVerified);
    } else if (statusFilter === "sold") {
      result = result.filter((property) => property?.sold);
    } else if (statusFilter === "available") {
      result = result.filter((property) => !property?.sold);
    }

    // Sorting
    if (sortBy === "price-low-high") {
      result.sort((a, b) => parsePrice(a?.price) - parsePrice(b?.price));
    } else if (sortBy === "price-high-low") {
      result.sort((a, b) => parsePrice(b?.price) - parsePrice(a?.price));
    } else if (sortBy === "name-az") {
      result.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    } else if (sortBy === "name-za") {
      result.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
    }

    return result;
  }, [properties, searchTerm, selectedType, statusFilter, sortBy]);

  useEffect(() => {
    onFilter(filteredProperties);
  }, [filteredProperties, onFilter]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedType("All Types");
    setStatusFilter("all");
    setSortBy("default");
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="page-kicker mb-3">
            <span className="page-dot" />
            Search and refine
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            Filter marketplace listings
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Search by property name or location, narrow listings by type and status,
            and sort results for a cleaner marketplace browsing experience.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Filtered Results
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {filteredProperties.length}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name, type, or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Property Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          >
            <option value="default">Default Order</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="name-az">Name: A to Z</option>
            <option value="name-za">Name: Z to A</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "Verified",
              value: properties.filter((p) => p?.governmentVerified).length,
              tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
            },
            {
              label: "Pending",
              value: properties.filter((p) => !p?.governmentVerified).length,
              tone: "bg-amber-50 text-amber-700 border-amber-200",
            },
            {
              label: "Sold",
              value: properties.filter((p) => p?.sold).length,
              tone: "bg-violet-50 text-violet-700 border-violet-200",
            },
          ].map((item) => (
            <span
              key={item.label}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${item.tone}`}
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="secondary-btn px-5 py-2.5 text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}