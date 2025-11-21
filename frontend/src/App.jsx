import React, { useState, useEffect } from 'react'

export default function App() {
    const [q, setQ] = useState('outfit for tropical vacation')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [rerank, setRerank] = useState(false)
    const [searchTime, setSearchTime] = useState(0)
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Responsive breakpoints
    const isMobile = windowWidth < 768
    const isTablet = windowWidth >= 768 && windowWidth < 1024
    const isDesktop = windowWidth >= 1024

    const exampleQueries = [
        { text: "men's beach shorts", emoji: "🏖️" },
        { text: "women's running shoes", emoji: "👟" },
        { text: "office outfit", emoji: "💼" },
        { text: "winter coat", emoji: "❄️" },
        { text: "wedding dress", emoji: "👰" },
        { text: "walking shoes", emoji: "🚶" }
    ]

    async function submit() {
        if (!q.trim()) return

        setLoading(true)
        const startTime = performance.now()

        try {
            const res = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q,
                    top_k: isMobile ? 8 : 12,
                    rerank
                })
            })
            const data = await res.json()

            const endTime = performance.now()
            setSearchTime(Math.round(endTime - startTime))

            setResults(data.results || [])
        } catch (e) {
            alert('Error: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            submit()
        }
    }

    const handleExampleClick = (example) => {
        setQ(example.text)
        setTimeout(() => submit(), 100)
    }

    return (
        <div style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '0',
            backgroundColor: '#0f172a',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            minHeight: '100vh',
            color: 'white',
            overflowX: 'hidden', // Prevent horizontal scroll
            width: '100%',
            maxWidth: '100vw' // Ensure it doesn't overflow viewport
        }}>
            {/* Enhanced Header - FIXED WIDTH */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                padding: isMobile ? '40px 16px 30px' : '60px 20px 40px',
                textAlign: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <h1 style={{
                        fontSize: isMobile ? '2.5rem' : isTablet ? '3rem' : '3.5rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: isMobile ? '12px' : '16px',
                        textShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                        lineHeight: 1.2,
                        wordWrap: 'break-word'
                    }}>
                        {isMobile ? '✨ StyleSense' : '✨ StyleSense AI'}
                    </h1>
                    <p style={{
                        fontSize: isMobile ? '1.1rem' : '1.3rem',
                        color: '#cbd5e1',
                        marginBottom: isMobile ? '8px' : '12px',
                        fontWeight: 300,
                        lineHeight: 1.4
                    }}>
                        {isMobile ? 'AI Fashion Search' : 'Discover fashion with AI-powered semantic intelligence'}
                    </p>

                    {results.length > 0 && (
                        <div style={{
                            display: 'flex',
                            gap: isMobile ? '12px' : '20px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            color: '#94a3b8',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{
                                background: 'rgba(102, 126, 234, 0.2)',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                whiteSpace: 'nowrap'
                            }}>
                                📊 {results.length} products
                            </span>
                            {searchTime > 0 && (
                                <span style={{
                                    background: 'rgba(34, 197, 94, 0.2)',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    ⚡ {searchTime}ms
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* FIXED Search Section - PROPERLY CENTERED */}
            <div style={{
                width: '100%',
                padding: isMobile ? '0 16px' : '0 20px',
                boxSizing: 'border-box',
                margin: isMobile ? '-20px auto 40px' : '-30px auto 50px',
                maxWidth: '800px' // Fixed max width
            }}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(20px)',
                    padding: isMobile ? '24px 20px' : '32px',
                    borderRadius: isMobile ? '16px' : '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {/* Search Input Group - FIXED LAYOUT */}
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '12px' : '16px',
                        marginBottom: isMobile ? '20px' : '24px',
                        alignItems: 'stretch',
                        width: '100%'
                    }}>
                        {/* Input Container - FIXED */}
                        <div style={{
                            flex: 1,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: isMobile ? '16px' : '20px',
                                zIndex: 2,
                                fontSize: isMobile ? '1.1rem' : '1.2rem',
                                color: '#64748b'
                            }}>
                                🔍
                            </div>
                            <input
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '16px 16px 16px 44px' : '18px 18px 18px 50px',
                                    fontSize: isMobile ? '14px' : '16px',
                                    borderRadius: isMobile ? '12px' : '14px',
                                    border: '2px solid rgba(102, 126, 234, 0.3)',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    boxSizing: 'border-box'
                                }}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={isMobile ? "What are you looking for? ✨" : "Describe what you're looking for... ✨"}
                                disabled={loading}
                            />
                        </div>

                        {/* Search Button - FIXED */}
                        <button
                            onClick={submit}
                            disabled={loading || !q.trim()}
                            style={{
                                padding: isMobile ? '0 20px' : '0 28px',
                                background: loading || !q.trim() ?
                                    'linear-gradient(135deg, #475569 0%, #64748b 100%)' :
                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: isMobile ? '12px' : '14px',
                                cursor: loading || !q.trim() ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: isMobile ? '14px' : '15px',
                                transition: 'all 0.3s ease',
                                minWidth: isMobile ? 'auto' : '140px',
                                height: isMobile ? '48px' : '54px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: loading || !q.trim() ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.4)',
                                position: 'relative',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && q.trim()) {
                                    e.target.style.transform = 'translateY(-2px)'
                                    e.target.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.6)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)'
                                e.target.style.boxShadow = loading || !q.trim() ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.4)'
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: isMobile ? '16px' : '18px',
                                        height: isMobile ? '16px' : '18px',
                                        border: '2px solid transparent',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <span>{isMobile ? '...' : 'Searching'}</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>🚀</span>
                                    <span>Search</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Rerank Toggle - FIXED */}
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        gap: isMobile ? '12px' : '16px',
                        justifyContent: 'center',
                        marginBottom: isMobile ? '20px' : '24px',
                        width: '100%'
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '10px' : '12px',
                            cursor: 'pointer',
                            color: '#cbd5e1',
                            fontSize: isMobile ? '14px' : '15px',
                            fontWeight: 500,
                            padding: isMobile ? '10px 16px' : '12px 20px',
                            background: 'rgba(15, 23, 42, 0.6)',
                            borderRadius: isMobile ? '10px' : '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            width: isMobile ? '100%' : 'auto',
                            justifyContent: isMobile ? 'center' : 'flex-start',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{
                                position: 'relative',
                                width: isMobile ? '44px' : '48px',
                                height: isMobile ? '24px' : '26px',
                                background: rerank ?
                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                                    'rgba(71, 85, 105, 0.6)',
                                borderRadius: isMobile ? '12px' : '13px',
                                transition: 'all 0.3s ease',
                                boxShadow: rerank ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '3px',
                                    left: rerank ? (isMobile ? '22px' : '24px') : '3px',
                                    width: isMobile ? '18px' : '20px',
                                    height: isMobile ? '18px' : '20px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                                }}></div>
                            </div>
                            <input
                                type="checkbox"
                                checked={rerank}
                                onChange={(e) => setRerank(e.target.checked)}
                                style={{ display: 'none' }}
                            />
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>🧠</span>
                                {isMobile ? 'AI Ranking' : 'AI Smart Ranking'}
                            </span>
                        </label>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(21, 128, 61, 0.2) 100%)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#86efac',
                            padding: isMobile ? '8px 14px' : '10px 16px',
                            borderRadius: isMobile ? '10px' : '12px',
                            fontSize: isMobile ? '12px' : '13px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                        }}>
                            {isMobile ? '+35% Better' : '+35% Better Results'}
                        </div>
                    </div>

                    {/* Example Queries - FIXED */}
                    <div style={{ width: '100%' }}>
                        <p style={{
                            textAlign: 'center',
                            color: '#94a3b8',
                            marginBottom: isMobile ? '12px' : '16px',
                            fontSize: isMobile ? '13px' : '14px'
                        }}>
                            Try these examples:
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                            gap: isMobile ? '8px' : '10px',
                            width: '100%'
                        }}>
                            {exampleQueries.map((example, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleExampleClick(example)}
                                    disabled={loading}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#cbd5e1',
                                        padding: isMobile ? '10px 12px' : '12px 16px',
                                        borderRadius: isMobile ? '8px' : '10px',
                                        fontSize: isMobile ? '12px' : '13px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        opacity: loading ? 0.6 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        textAlign: 'left',
                                        boxSizing: 'border-box'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading) {
                                            e.target.style.background = 'rgba(102, 126, 234, 0.2)'
                                            e.target.style.border = '1px solid rgba(102, 126, 234, 0.5)'
                                            e.target.style.transform = 'translateY(-1px)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!loading) {
                                            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                                            e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                                            e.target.style.transform = 'translateY(0)'
                                        }
                                    }}
                                >
                                    <span style={{ flexShrink: 0, fontSize: '1.1rem' }}>{example.emoji}</span>
                                    <span style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                    }}>
                                        {example.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid - FIXED */}
            <div style={{
                width: '100%',
                padding: isMobile ? '0 16px 40px' : '0 20px 60px',
                boxSizing: 'border-box',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {results.length === 0 && !loading && (
                    <EmptyState isMobile={isMobile} hasQuery={!!q} />
                )}

                {results.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: isMobile ? '16px' : '24px',
                        width: '100%'
                    }}>
                        {results.map((r, i) => (
                            <ProductCard
                                key={i}
                                product={r}
                                index={i}
                                isMobile={isMobile}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Ensure no horizontal scroll */
                body {
                    margin: 0;
                    padding: 0;
                    overflow-x: hidden;
                }

                /* Mobile optimizations */
                @media (max-width: 768px) {
                    input, button {
                        -webkit-appearance: none;
                        border-radius: 12px;
                    }
                    
                    /* Improve touch targets */
                    button {
                        min-height: 44px;
                    }
                }
            `}</style>
        </div>
    )
}

// Empty State Component
const EmptyState = ({ isMobile, hasQuery }) => {
    return (
        <div style={{
            textAlign: 'center',
            color: '#64748b',
            padding: isMobile ? '60px 20px' : '80px 20px',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{
                fontSize: isMobile ? '3rem' : '4rem',
                marginBottom: isMobile ? '16px' : '20px',
                opacity: 0.5
            }}>
                {hasQuery ? '🔍' : '🎯'}
            </div>
            <h3 style={{
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                color: '#cbd5e1',
                marginBottom: isMobile ? '8px' : '12px'
            }}>
                {hasQuery ? 'No products found' : 'Ready to Discover Amazing Fashion?'}
            </h3>
            <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: '#94a3b8',
                lineHeight: 1.5
            }}>
                {hasQuery
                    ? 'Try adjusting your search terms or try one of the examples'
                    : 'Describe what you\'re looking for or try one of the examples above'
                }
            </p>
        </div>
    )
}

// Product Card Component
const ProductCard = ({ product, index, isMobile }) => {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)

    const getImageUrl = () => {
        if (!product.raw?.images?.[0]) return null
        const images = product.raw.images[0]
        return images.hi_res || images.large || images.thumb
    }

    const imageUrl = getImageUrl()

    return (
        <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '20px' : '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeInUp 0.6s ease-out',
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Product Image */}
            {imageUrl && (
                <div style={{
                    width: '100%',
                    height: isMobile ? '180px' : '220px',
                    marginBottom: isMobile ? '16px' : '20px',
                    borderRadius: isMobile ? '12px' : '16px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    position: 'relative'
                }}>
                    <img
                        src={imageUrl}
                        alt={product.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.4s ease',
                            opacity: imageLoaded ? 1 : 0
                        }}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />

                    {!imageLoaded && !imageError && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            color: '#475569',
                            fontSize: isMobile ? '12px' : '14px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: isMobile ? '14px' : '16px',
                                    height: isMobile ? '14px' : '16px',
                                    border: '2px solid #475569',
                                    borderTop: '2px solid #64748b',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                Loading...
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Product Info */}
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontWeight: 600,
                    fontSize: isMobile ? '14px' : '16px',
                    marginBottom: isMobile ? '10px' : '12px',
                    color: '#f1f5f9',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: isMobile ? '40px' : '44px'
                }}>
                    {product.title || product.raw?.title || 'No title available'}
                </h3>

                {/* Price and Rating */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '12px' : '16px',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    {(product.price || product.raw?.price) && (
                        <div style={{
                            color: '#10b981',
                            fontWeight: 700,
                            fontSize: isMobile ? '18px' : '20px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap'
                        }}>
                            ${product.price || product.raw?.price}
                        </div>
                    )}
                    {(product.rating || product.raw?.average_rating) && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#f59e0b',
                            fontWeight: 600,
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap'
                        }}>
                            <span>⭐</span>
                            <span>{product.rating || product.raw?.average_rating}</span>
                        </div>
                    )}
                </div>

                {/* Match Score */}
                {product.score !== undefined && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                        color: '#c7d2fe',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        border: '1px solid rgba(102, 126, 234, 0.3)'
                    }}>
                        <span>🎯</span>
                        <span>{(product.score * 100).toFixed(1)}% Match</span>
                    </div>
                )}
            </div>
        </div>
    )
}