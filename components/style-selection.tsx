'use client';

import { useState } from 'react';
import type { StyleType } from '@/app/page';
import { Palette, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import { styles } from '@/lib/styles';

interface StyleSelectionProps {
  originalImage: string;
  onStyleSelect: (style: StyleType) => void;
}

const CATEGORIES = [
  { key: 'artistic', label: 'ARTISTIC' },
  { key: 'modern', label: 'MODERN' },
  { key: 'digital', label: 'DIGITAL' }
];

const STYLES_PER_PAGE = 6;

export function StyleSelection({ originalImage, onStyleSelect }: StyleSelectionProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Filter and paginate styles
  const filteredStyles = (filter ? styles.filter((s) => s.category === filter) : styles).sort(
    (a, b) => Number(b.popular) - Number(a.popular)
  );
  const totalPages = Math.ceil(filteredStyles.length / STYLES_PER_PAGE);
  const paginatedStyles = filteredStyles.slice(
    (page - 1) * STYLES_PER_PAGE,
    page * STYLES_PER_PAGE
  );

  const handleCategoryClick = (cat: string) => {
    setFilter(cat);
    setPage(1);
  };
  const handleClearFilter = () => {
    setFilter(null);
    setPage(1);
  };
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-8">
      {/* Original Image Display */}
      <div className="text-center">
        <div className="relative w-64 h-64 mx-auto border-8 border-black shadow-[8px_8px_0px_0px_#000000] mb-4">
          <Image
            src={originalImage || '/placeholder.svg'}
            alt="Original"
            fill
            className="object-cover"
          />
        </div>
        <div className="bg-black text-white px-4 py-2 border-4 border-black font-black text-lg uppercase inline-block">
          ORIGINAL IMAGE
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center space-x-4 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategoryClick(cat.key)}
            className={`px-6 py-4 border-4 border-black font-black text-lg uppercase transition-all ${
              filter === cat.key
                ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_#000000]'
                : 'bg-white text-black hover:bg-yellow-400 hover:text-black hover:shadow-[4px_4px_0px_0px_#000000]'
            }`}
          >
            {cat.label}
          </button>
        ))}
        {filter && (
          <button
            onClick={handleClearFilter}
            className="px-4 py-4 border-4 border-black font-black text-lg uppercase bg-gray-200 text-black hover:bg-gray-300 ml-2"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedStyles.map((style) => (
          <div
            key={style.id}
            onClick={() => onStyleSelect(style.id as any)}
            className="cursor-pointer transition-all hover:scale-105 group"
          >
            <div
              className={`bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000] hover:shadow-[12px_12px_0px_0px_#000000] transition-all`}
            >
              {/* Style Badge */}
              {style.popular && (
                <div className="bg-orange-500 text-white px-3 py-1 border-b-4 border-black font-black text-sm uppercase">
                  🔥 POPULAR
                </div>
              )}
              {/* {style.trending && (
                <div className="bg-green-500 text-white px-3 py-1 border-b-4 border-black font-black text-sm uppercase">
                  ⚡ TRENDING
                </div>
              )} */}
              <div className="p-6 space-y-4">
                {/* Style Preview */}
                <div className={`relative w-full h-40 border-4 border-black ${style.color}`}>
                  <Image
                    src="/placeholder.svg?height=160&width=200"
                    alt={style.name}
                    fill
                    className="object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black text-white px-4 py-2 border-2 border-white font-black text-lg uppercase">
                      {style.name}
                    </div>
                  </div>
                </div>
                {/* Style Info */}
                <div className="text-center space-y-2">
                  <h4 className="font-black text-2xl uppercase">{style.name}</h4>
                  <p className="font-bold text-lg uppercase tracking-wide text-gray-600">
                    {style.description}
                  </p>
                </div>
                {/* Select Button */}
                <button className="w-full bg-black text-white py-3 border-4 border-black font-black text-lg uppercase hover:bg-gray-800 transition-colors">
                  SELECT STYLE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className={`px-6 py-3 border-4 border-black font-black text-lg uppercase transition-all shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] ${
            page === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
              : 'bg-white text-black hover:bg-yellow-400 hover:text-black'
          }`}
        >
          Prev
        </button>
        <span className="font-black text-xl mx-4">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className={`px-6 py-3 border-4 border-black font-black text-lg uppercase transition-all shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] ${
            page === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
              : 'bg-white text-black hover:bg-yellow-400 hover:text-black'
          }`}
        >
          Next
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <div className="bg-cyan-400 text-black px-8 py-4 border-4 border-black font-black text-xl uppercase inline-block">
          ⚡ FREE PREVIEW BEFORE PAYMENT ⚡
        </div>
      </div>
    </div>
  );
}
