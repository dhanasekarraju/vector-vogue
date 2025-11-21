import React, { useState, useEffect } from 'react';
import { Search, Sliders, History, X, TrendingUp, Star, DollarSign, Filter, Moon, Sun, Sparkles } from 'lucide-react';

export default function App() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [useRerank, setUseRerank] = useState(true);
    const [searchTime, setSearchTime] = useState(0);
    const [isDark, setIsDark] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);

    // Advanced filters
    const [filters, setFilters] = useState({
        gender: 'all',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        sortBy: 'relevance'
    });

    // Auto-search when filters change (if there's already a query)
    useEffect(() => {
        if (query.trim() && results.length > 0) {
            const timeoutId = setTimeout(() => {
                handleSearch();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [filters]);

    // Load search history from memory
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

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        const startTime = performance.now();

        try {
            // Build the request payload
            const payload = {
                q: query,
                top_k: 12,
                rerank: useRerank
            };

            // Add gender filter if not 'all'
            if (filters.gender && filters.gender !== 'all') {
                payload.gender_filter = filters.gender;
            }

            // Call your actual backend API
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            let filteredResults = data.results || [];

            // Apply client-side filters for price and rating
            if (filters.minPrice || filters.maxPrice || filters.minRating) {
                filteredResults = filteredResults.filter(product => {
                    const price = product.price || product.raw?.price;
                    const rating = product.rating || product.raw?.average_rating;

                    // Price filters
                    if (filters.minPrice && price < parseFloat(filters.minPrice)) {
                        return false;
                    }
                    if (filters.maxPrice && price > parseFloat(filters.maxPrice)) {
                        return false;
                    }

                    // Rating filter
                    if (filters.minRating && rating < parseFloat(filters.minRating)) {
                        return false;
                    }

                    return true;
                });
            }

            const endTime = performance.now();
            setSearchTime(Math.round(endTime - startTime));
            setResults(filteredResults);

            // Add to history
            const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
            setSearchHistory(newHistory);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));

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

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.bg,
            color: theme.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            transition: 'all 0.3s ease'
        }}>
            {/* Professional Header */}
            <header style={{
                background: theme.surface,
                borderBottom: `1px solid ${theme.border}`,
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backdropFilter: 'blur(10px)',
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={28} style={{ color: theme.accent }} />
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            // background: theme.gradient,
                            color: 'royalblue',
                            // WebkitBackgroundClip: 'text',
                            // WebkitTextFillColor: 'transparent',
                            margin: 0
                        }}>
                            Vector Vogue
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {searchTime > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: theme.textSecondary,
                                background: theme.surfaceHover,
                                padding: '6px 12px',
                                borderRadius: '6px'
                            }}>
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
                                color: theme.text
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
                    <div style={{
                        background: theme.surface,
                        borderRadius: '16px',
                        border: `1px solid ${theme.border}`,
                        padding: '32px',
                        boxShadow: isDark
                            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {/* Search Input */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    flex: 1,
                                    position: 'relative'
                                }}>
                                    <Search
                                        size={20}
                                        style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: theme.textTertiary
                                        }}
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
                                            boxSizing: 'border-box'
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
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Sliders size={18} />
                                    <span>Filters</span>
                                </button>

                                <button
                                    onClick={handleSearch}
                                    disabled={loading || !query.trim()}
                                    style={{
                                        padding: '16px 32px',
                                        background: loading || !query.trim() ? theme.surfaceHover : theme.gradient,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease',
                                        opacity: loading || !query.trim() ? 0.5 : 1,
                                        minWidth: '120px'
                                    }}
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div style={{
                                padding: '24px',
                                background: theme.bg,
                                borderRadius: '12px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px'
                                }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: theme.textSecondary,
                                            marginBottom: '8px'
                                        }}>Gender</label>
                                        <select
                                            value={filters.gender}
                                            onChange={(e) => setFilters({...filters, gender: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="all">All</option>
                                            <option value="men">Men</option>
                                            <option value="women">Women</option>
                                            <option value="unisex">Unisex</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: theme.textSecondary,
                                            marginBottom: '8px'
                                        }}>Min Price</label>
                                        <input
                                            type="number"
                                            value={filters.minPrice}
                                            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                                            placeholder="$0"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: theme.textSecondary,
                                            marginBottom: '8px'
                                        }}>Max Price</label>
                                        <input
                                            type="number"
                                            value={filters.maxPrice}
                                            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                                            placeholder="$1000"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: theme.textSecondary,
                                            marginBottom: '8px'
                                        }}>Min Rating</label>
                                        <select
                                            value={filters.minRating}
                                            onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                color: theme.text,
                                                fontSize: '14px'
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

                        {/* AI Reranking Toggle */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            background: theme.bg,
                            borderRadius: '12px'
                        }}>
                            <div>
                                <div style={{
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    marginBottom: '4px'
                                }}>
                                    AI Smart Ranking
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: theme.textSecondary
                                }}>
                                    +35% better relevance with cross-encoder reranking
                                </div>
                            </div>
                            <label style={{
                                position: 'relative',
                                display: 'inline-block',
                                width: '52px',
                                height: '28px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={useRerank}
                                    onChange={(e) => setUseRerank(e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: useRerank ? theme.accent : theme.border,
                                    borderRadius: '14px',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        height: '22px',
                                        width: '22px',
                                        left: useRerank ? '27px' : '3px',
                                        bottom: '3px',
                                        background: '#fff',
                                        borderRadius: '50%',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        {/* Search History */}
                        {searchHistory.length > 0 && (
                            <div style={{
                                marginTop: '20px',
                                padding: '16px',
                                background: theme.bg,
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: theme.textSecondary
                                    }}>
                                        <History size={16} />
                                        <span>Recent Searches</span>
                                    </div>
                                    <button
                                        onClick={clearHistory}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: theme.textTertiary,
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            padding: '4px 8px'
                                        }}
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}>
                                    {searchHistory.slice(0, 5).map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleHistoryClick(item)}
                                            style={{
                                                padding: '6px 12px',
                                                background: theme.surface,
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                color: theme.textSecondary,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results */}
                {results.length > 0 ? (
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '24px'
                        }}>
                            <h2 style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                margin: 0
                            }}>
                                {results.length} Results
                            </h2>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '24px'
                        }}>
                            {results.map((product, idx) => (
                                <ProductCard
                                    key={idx}
                                    product={product}
                                    theme={theme}
                                    isDark={isDark}
                                />
                            ))}
                        </div>
                    </div>
                ) : !loading && query && (
                    <EmptyState theme={theme} />
                )}
            </main>
        </div>
    );
}

function ProductCard({ product, theme, isDark }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }}>
            {/* Image */}
            <div style={{
                width: '100%',
                height: '280px',
                background: theme.bg,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <img
                    src={product.raw?.images?.[0]?.hi_res}
                    alt={product.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: imageLoaded ? 1 : 0,
                        transition: 'all 0.3s ease'
                    }}
                    onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: theme.textTertiary
                    }}>
                        Loading...
                    </div>
                )}

                {/* Match Score Badge */}
                {product.score && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(10px)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#fff'
                    }}>
                        {(product.score * 100).toFixed(0)}% Match
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
                <h3 style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '42px'
                }}>
                    {product.title}
                </h3>

                {product.raw?.brand && (
                    <div style={{
                        fontSize: '12px',
                        color: theme.textTertiary,
                        marginBottom: '12px'
                    }}>
                        {product.raw.brand}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: theme.success
                    }}>
                        ${product.price}
                    </div>

                    {product.rating && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            fontWeight: 500
                        }}>
                            <Star size={14} style={{ color: theme.warning, fill: theme.warning }} />
                            <span>{product.rating}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptyState({ theme }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: theme.textTertiary
        }}>
            <Search size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: theme.textSecondary,
                marginBottom: '8px'
            }}>
                No results found
            </h3>
            <p style={{ fontSize: '14px' }}>
                Try adjusting your search or filters
            </p>
        </div>
    );
}