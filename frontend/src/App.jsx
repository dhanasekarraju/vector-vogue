import React, { useState, useEffect } from 'react';
import { Search, Sliders, History, TrendingUp, Star, Moon, Sun, Sparkles, X, Heart, ExternalLink } from 'lucide-react';

export default function App() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [useRerank, setUseRerank] = useState(true);
    const [searchTime, setSearchTime] = useState(0);
    const [isDark, setIsDark] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const toBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });

    // Advanced filters
    const [filters, setFilters] = useState({
        gender: 'all',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        sortBy: 'relevance',
    });

    // Auto-search when filters change
    useEffect(() => {
        if (query.trim() || imageFile) {
            const timeoutId = setTimeout(() => {
                handleSearch();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [filters]);

    // Load search history
    useEffect(() => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            try {
                setSearchHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load history');
            }
        }
    }, []);

    const theme = {
        bg: isDark ? '#0a0e1a' : '#f8f9fa',
        surface: isDark ? '#111827' : '#ffffff',
        surfaceHover: isDark ? '#1f2937' : '#f3f4f6',
        border: isDark ? '#1f2937' : '#e5e7eb',
        text: isDark ? '#f9fafb' : '#111827',
        textSecondary: isDark ? '#9ca3af' : '#6b7280',
        textTertiary: isDark ? '#6b7280' : '#9ca3af',
        accent: isDark ? '#6366f1' : '#4f46e5',
        accentHover: isDark ? '#818cf8' : '#6366f1',
        success: '#10b981',
        warning: '#f59e0b',
        gradient: isDark
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    };

    // Use the exact same image path as your working version
    const getProductImage = (product) => {
        // Try the exact path from your working version first
        const image = product.raw?.images?.[0]?.hi_res ||
            product.image ||
            product.raw?.image ||
            product.raw?.main_image ||
            '/placeholder-image.jpg';

        console.log('Image URL:', image); // Debug log
        return image;
    };

    const getProductData = (product) => {
        const name = product.name || product.title || product.raw?.name || product.raw?.title || 'Product Name';
        const price = product.price || product.raw?.price || product.raw?.sale_price || product.raw?.list_price || 0;
        const rating = product.rating || product.raw?.average_rating || product.raw?.rating || product.raw?.review_score || 0;
        const brand = product.brand || product.raw?.brand || '';
        const image = getProductImage(product);
        const explanation = product.explanation || '';

        return { name, price, rating, brand, image, explanation };
    };

    const handleSearch = async () => {
        if (!query.trim() && !imageFile) return;

        setLoading(true);
        const startTime = performance.now();

        try {
            let payload = {
                q: query.trim() || '',
                image_base64: null,
                top_k: 12,
                rerank: useRerank,
            };

            if (imageFile) {
                const base64 = await toBase64(imageFile);
                payload.image_base64 = base64;
                payload.q = query.trim() || '';
            }

            if (filters.gender && filters.gender !== 'all') {
                payload.gender_filter = filters.gender;
            }

            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            let filteredResults = data.results || [];

            // Log first product to debug
            if (filteredResults.length > 0) {
                console.log('First product data:', filteredResults[0]);
                console.log('Image path:', getProductImage(filteredResults[0]));
            }

            // Client-side filters
            if (filters.minPrice || filters.maxPrice || filters.minRating) {
                filteredResults = filteredResults.filter((product) => {
                    const price = product.price || product.raw?.price;
                    const rating = product.rating || product.raw?.average_rating;
                    if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
                    if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
                    if (filters.minRating && rating < parseFloat(filters.minRating)) return false;
                    return true;
                });
            }

            const endTime = performance.now();
            setSearchTime(Math.round(endTime - startTime));
            setResults(filteredResults);

            // Update history
            if (query.trim()) {
                const newHistory = [query, ...searchHistory.filter((h) => h !== query)].slice(0, 10);
                setSearchHistory(newHistory);
                localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            }
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const handleHistoryClick = (historyQuery) => {
        setQuery(historyQuery);
        setTimeout(() => handleSearch(), 100);
    };

    // Product Details Modal Component
    const ProductDetailsModal = ({ product, onClose, theme, isDark }) => {
        const { name, price, rating, brand, image } = getProductData(product);
        const rawProduct = product.raw || {};

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }} onClick={onClose}>
                <div style={{
                    background: theme.surface,
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative',
                }} onClick={(e) => e.stopPropagation()}>
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: theme.textSecondary,
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ×
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Product Image */}
                        <div>
                            <img
                                src={image}
                                alt={name}
                                style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    aspectRatio: '1',
                                    objectFit: 'cover',
                                }}
                                onError={(e) => {
                                    e.target.src = `data:image/svg+xml;base64,${btoa(`
                                        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="100%" height="100%" fill="${isDark ? '#374151' : '#f3f4f6'}"/>
                                            <text x="50%" y="50%" font-family="Arial" font-size="16" fill="${isDark ? '#9ca3af' : '#6b7280'}" text-anchor="middle" dy=".3em">No Image Available</text>
                                        </svg>
                                    `)}`;
                                }}
                            />
                        </div>

                        {/* Product Info */}
                        <div>
                            <h2 style={{
                                margin: '0 0 12px 0',
                                fontSize: '24px',
                                fontWeight: 600,
                                color: theme.text
                            }}>
                                {name}
                            </h2>

                            {brand && (
                                <p style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '16px',
                                    color: theme.accent,
                                    fontWeight: 500
                                }}>
                                    Brand: {brand}
                                </p>
                            )}

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginBottom: '20px'
                            }}>
                                <span style={{
                                    fontSize: '28px',
                                    fontWeight: 700,
                                    color: theme.success
                                }}>
                                    ${typeof price === 'number' ? price.toFixed(2) : parseFloat(price || 0).toFixed(2)}
                                </span>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: theme.surfaceHover,
                                    padding: '6px 12px',
                                    borderRadius: '20px'
                                }}>
                                    <Star size={16} style={{ color: theme.warning }} fill={theme.warning} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                        {typeof rating === 'number' ? rating.toFixed(1) : parseFloat(rating || 0).toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: theme.text
                                }}>
                                    Product Details
                                </h3>

                                {rawProduct.description && (
                                    <p style={{
                                        margin: '0 0 12px 0',
                                        fontSize: '14px',
                                        color: theme.textSecondary,
                                        lineHeight: '1.5'
                                    }}>
                                        {typeof rawProduct.description === 'string'
                                            ? rawProduct.description
                                            : JSON.stringify(rawProduct.description)}
                                    </p>
                                )}

                                {rawProduct.features && Array.isArray(rawProduct.features) && (
                                    <div>
                                        <h4 style={{
                                            margin: '0 0 8px 0',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: theme.text
                                        }}>
                                            Features:
                                        </h4>
                                        <ul style={{
                                            margin: 0,
                                            paddingLeft: '20px',
                                            color: theme.textSecondary,
                                            fontSize: '14px'
                                        }}>
                                            {rawProduct.features.slice(0, 5).map((feature, idx) => (
                                                <li key={idx}>{feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    style={{
                                        padding: '12px 24px',
                                        background: theme.accent,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onClick={() => {
                                        if (rawProduct.url || rawProduct.link) {
                                            window.open(rawProduct.url || rawProduct.link, '_blank');
                                        } else {
                                            alert('Product link not available');
                                        }
                                    }}
                                >
                                    <ExternalLink size={16} />
                                    Buy Now
                                </button>

                                <button
                                    style={{
                                        padding: '12px 24px',
                                        background: 'transparent',
                                        color: theme.accent,
                                        border: `2px solid ${theme.accent}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onClick={() => {
                                        // Add to favorites functionality
                                        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                                        const newFavorites = [...favorites, product];
                                        localStorage.setItem('favorites', JSON.stringify(newFavorites));
                                        alert('Added to favorites!');
                                    }}
                                >
                                    <Heart size={16} />
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AI Explanation */}
                    {product.explanation && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            background: theme.bg,
                            borderRadius: '8px',
                            border: `1px solid ${theme.border}`
                        }}>
                            <h4 style={{
                                margin: '0 0 8px 0',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: theme.text
                            }}>
                                🤖 AI Insight
                            </h4>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: theme.textSecondary,
                                lineHeight: '1.4'
                            }}>
                                {product.explanation}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: theme.bg,
                color: theme.text,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Header */}
            <header
                style={{
                    background: theme.surface,
                    borderBottom: `1px solid ${theme.border}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                }}
            >
                <div
                    style={{
                        maxWidth: '1400px',
                        margin: '0 auto',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={28} style={{ color: theme.accent }} />
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'royalblue', margin: 0 }}>Vector Vogue</h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {searchTime > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '13px',
                                    color: theme.textSecondary,
                                    background: theme.surfaceHover,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                }}
                            >
                                <TrendingUp size={14} />
                                <span>{searchTime}ms</span>
                            </div>
                        )}

                        <button
                            onClick={() => setIsDark(!isDark)}
                            style={{
                                background: theme.surfaceHover,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                color: theme.text,
                            }}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
                {/* Search Section */}
                <div style={{ marginBottom: '40px' }}>
                    {/* Image Upload */}
                    <div
                        style={{
                            background: theme.surface,
                            border: `1px dashed ${theme.border}`,
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            marginBottom: '20px',
                            cursor: 'pointer',
                        }}
                        onClick={() => document.getElementById('imageInput').click()}
                    >
                        <input
                            id="imageInput"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    // Validate file
                                    if (!file.type.startsWith('image/')) {
                                        alert('Please select an image file (JPEG, PNG, etc.)');
                                        return;
                                    }
                                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                                        alert('Image size should be less than 5MB');
                                        return;
                                    }
                                    setImageFile(file);
                                    setImagePreview(URL.createObjectURL(file));

                                    // Clear text query when using image search
                                    setQuery('');

                                    // Auto-search with image
                                    setTimeout(() => handleSearch(), 100);
                                }
                            }}
                        />
                        {!imagePreview ? (
                            <div>
                                <p style={{ color: theme.textSecondary, marginBottom: '8px' }}>Upload an image to search visually</p>
                                <p style={{ fontSize: '12px', color: theme.textTertiary }}>Click to select an image file</p>
                            </div>
                        ) : (
                            <div>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '10px' }}
                                />
                                <br />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImageFile(null);
                                        setImagePreview(null);
                                        setResults([]);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        marginRight: '8px',
                                    }}
                                >
                                    Remove Image
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSearch();
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: theme.accent,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                    }}
                                >
                                    Search This Image
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Search Input & Filters */}
                    <div
                        style={{
                            background: theme.surface,
                            borderRadius: '16px',
                            border: `1px solid ${theme.border}`,
                            padding: '32px',
                            boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <Search
                                        size={20}
                                        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.textTertiary }}
                                    />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Describe what you're looking for..."
                                        style={{
                                            width: '100%',
                                            padding: '16px 16px 16px 48px',
                                            fontSize: '16px',
                                            background: theme.bg,
                                            border: `2px solid ${theme.border}`,
                                            borderRadius: '12px',
                                            color: theme.text,
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    style={{
                                        padding: '16px 20px',
                                        background: showFilters ? theme.accent : theme.surfaceHover,
                                        color: showFilters ? '#fff' : theme.text,
                                        border: `1px solid ${showFilters ? theme.accent : theme.border}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Sliders size={18} />
                                    <span>Filters</span>
                                </button>

                                <button
                                    onClick={handleSearch}
                                    disabled={loading || (!query.trim() && !imageFile)}
                                    style={{
                                        padding: '16px 32px',
                                        background: loading || (!query.trim() && !imageFile) ? theme.surfaceHover : theme.gradient,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: loading || (!query.trim() && !imageFile) ? 'not-allowed' : 'pointer',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease',
                                        opacity: loading || (!query.trim() && !imageFile) ? 0.5 : 1,
                                        minWidth: '120px',
                                    }}
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div
                                style={{
                                    padding: '24px',
                                    background: theme.bg,
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: theme.textSecondary, marginBottom: '8px' }}>
                                            Gender
                                        </label>
                                        <select
                                            value={filters.gender}
                                            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px',
                                            }}
                                        >
                                            <option value="all">All</option>
                                            <option value="men">Men</option>
                                            <option value="women">Women</option>
                                            <option value="unisex">Unisex</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: theme.textSecondary, marginBottom: '8px' }}>
                                            Min Price
                                        </label>
                                        <input
                                            type="number"
                                            value={filters.minPrice}
                                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                            placeholder="$0"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: theme.textSecondary, marginBottom: '8px' }}>
                                            Max Price
                                        </label>
                                        <input
                                            type="number"
                                            value={filters.maxPrice}
                                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                            placeholder="$1000"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: theme.textSecondary, marginBottom: '8px' }}>
                                            Min Rating
                                        </label>
                                        <select
                                            value={filters.minRating}
                                            onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px',
                                            }}
                                        >
                                            <option value="">Any</option>
                                            <option value="3">3+ Stars</option>
                                            <option value="4">4+ Stars</option>
                                            <option value="4.5">4.5+ Stars</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Reranking */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                background: theme.bg,
                                borderRadius: '12px',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>AI Smart Ranking</div>
                                <div style={{ fontSize: '12px', color: theme.textSecondary }}>+35% better relevance with cross-encoder reranking</div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={useRerank}
                                    onChange={(e) => setUseRerank(e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: useRerank ? theme.accent : theme.border,
                                        borderRadius: '14px',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                  <span
                      style={{
                          position: 'absolute',
                          height: '22px',
                          width: '22px',
                          left: useRerank ? '26px' : '4px',
                          bottom: '3px',
                          background: '#fff',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                      }}
                  />
                </span>
                            </label>
                        </div>
                    </div>

                    {/* Recent Search History */}
                    {searchHistory.length > 0 && (
                        <div style={{ marginTop: '20px', background: theme.surface, padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', color: theme.textSecondary }}>Recent Searches</h3>
                                <button
                                    onClick={clearHistory}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: theme.accent,
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {searchHistory.map((h, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleHistoryClick(h)}
                                        style={{
                                            padding: '6px 12px',
                                            background: theme.surfaceHover,
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Results */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    {results.map((product, idx) => {
                        const { name, price, rating, brand, image, explanation } = getProductData(product);

                        return (
                            <div
                                key={idx}
                                style={{
                                    background: theme.surface,
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '200px',
                                    position: 'relative',
                                    backgroundColor: theme.border,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img
                                        src={image}
                                        alt={name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                        onError={(e) => {
                                            console.error('Image failed to load:', image);
                                            // Simple fallback
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="100%" height="100%" fill="${isDark ? '#374151' : '#f3f4f6'}"/>
                                                    <text x="50%" y="50%" font-family="Arial" font-size="14" fill="${isDark ? '#9ca3af' : '#6b7280'}" text-anchor="middle" dy=".3em">No Image</text>
                                                </svg>
                                            `)}`;
                                        }}
                                        onLoad={() => console.log('Image loaded successfully:', image)}
                                    />
                                </div>
                                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: theme.text }}>{name}</h4>
                                        {brand && (
                                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: theme.textSecondary }}>
                                                {brand}
                                            </p>
                                        )}
                                        <p style={{ margin: '6px 0 0', fontSize: '14px', color: theme.textSecondary }}>
                                            ${typeof price === 'number' ? price.toFixed(2) : parseFloat(price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: theme.textSecondary }}>
                                            ⭐ {typeof rating === 'number' ? rating.toFixed(1) : parseFloat(rating || 0).toFixed(1)}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduct(product);
                                                setShowDetails(true);
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                background: theme.accent,
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                    {explanation && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '8px',
                                            background: theme.bg,
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            color: theme.textSecondary,
                                            lineHeight: '1.3'
                                        }}>
                                            {explanation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Product Details Modal */}
                {showDetails && selectedProduct && (
                    <ProductDetailsModal
                        product={selectedProduct}
                        onClose={() => {
                            setShowDetails(false);
                            setSelectedProduct(null);
                        }}
                        theme={theme}
                        isDark={isDark}
                    />
                )}
            </main>
        </div>
    );
}