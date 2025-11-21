import React, { useState } from 'react'

export default function App() {
    const [q, setQ] = useState('outfit for tropical vacation')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [rerank, setRerank] = useState(false)

    async function submit() {
        if (!q.trim()) return

        setLoading(true)
        try {
            const res = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q, top_k: 10, rerank })
            })
            const data = await res.json()
            console.log('Backend returned:', data)
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

    return (
        <div style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            padding: '40px 20px',
            backgroundColor: '#f8fafc',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto 40px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    color: '#1e293b',
                    marginBottom: '12px',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    🌟 Semantic Recommender
                </h1>
                <p style={{
                    color: '#64748b',
                    fontSize: '1.1rem',
                    marginBottom: '8px'
                }}>
                    Discover products with AI-powered semantic search
                </p>
                <div style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                    marginBottom: '30px'
                }}>
                    {results.length > 0 && `Found ${results.length} products`}
                </div>
            </div>

            {/* Search Section */}
            <div style={{
                maxWidth: '800px',
                margin: '0 auto 40px',
                background: 'white',
                padding: '30px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', width: '100%' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            style={{
                                width: '90%',
                                padding: '16px 20px',
                                fontSize: '16px',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                backgroundColor: '#f8fafc'
                            }}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Describe what you're looking for..."
                            disabled={loading}
                        />
                    </div>
                    <button
                        onClick={submit}
                        disabled={loading || !q.trim()}
                        style={{
                            padding: '16px 32px',
                            backgroundColor: loading || !q.trim() ? '#cbd5e1' : '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: loading || !q.trim() ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            minWidth: '140px',
                            height: '52px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && q.trim()) {
                                e.target.style.transform = 'translateY(-2px)'
                                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = 'none'
                        }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid transparent',
                                    borderTop: '2px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                Searching...
                            </span>
                        ) : 'Search'}
                    </button>
                </div>

                {/* Rerank Toggle */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: 'center'
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontSize: '14px',
                        fontWeight: 500
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '44px',
                            height: '24px',
                            backgroundColor: rerank ? '#667eea' : '#cbd5e1',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: rerank ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                            }}></div>
                        </div>
                        <input
                            type="checkbox"
                            checked={rerank}
                            onChange={(e) => setRerank(e.target.checked)}
                            style={{ display: 'none' }}
                        />
                        Enable AI Reranking
                    </label>
                    <span style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        backgroundColor: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '6px'
                    }}>
                        Better results
                    </span>
                </div>
            </div>

            {/* Results Grid */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {results.length === 0 && !loading && (
                    <div style={{
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '1.1rem',
                        padding: '60px 20px'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                        <p>Enter a search query to find products</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                            Try: "beach dress", "running shoes", "office chair"
                        </p>
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {results.map((r, i) => (
                        <div
                            key={i}
                            style={{
                                border: '1px solid #f1f5f9',
                                borderRadius: '16px',
                                padding: '20px',
                                background: 'white',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)'
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {/* High Quality Product Images */}
                            {r.raw?.images?.[0] && (
                                <div style={{
                                    width: '100%',
                                    height: '200px',
                                    marginBottom: '16px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    backgroundColor: '#f8fafc',
                                    position: 'relative'
                                }}>
                                    <img
                                        src={
                                            r.raw.images[0].hi_res ||
                                            r.raw.images[0].large ||
                                            r.raw.images[0].thumb
                                        }
                                        alt={r.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onError={(e) => {
                                            // Fallback to lower quality if image fails
                                            const currentSrc = e.target.src;
                                            if (currentSrc === r.raw.images[0].hi_res && r.raw.images[0].large) {
                                                e.target.src = r.raw.images[0].large;
                                            } else if (currentSrc === r.raw.images[0].large && r.raw.images[0].thumb) {
                                                e.target.src = r.raw.images[0].thumb;
                                            }
                                        }}
                                        onLoad={(e) => {
                                            // Hide loading when image loads
                                            e.target.nextSibling.style.display = 'none';
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    />

                                    {/* Loading placeholder */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f8fafc',
                                        color: '#cbd5e1',
                                        fontSize: '14px',
                                        pointerEvents: 'none'
                                    }}>
                                        Loading image...
                                    </div>
                                </div>
                            )}

                            {/* Product Info */}
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    fontWeight: 600,
                                    fontSize: '16px',
                                    marginBottom: '12px',
                                    color: '#1e293b',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {r.title || r.raw?.title || 'No title'}
                                </h3>

                                {/* Price and Rating */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    {(r.price || r.raw?.price) && (
                                        <div style={{
                                            color: '#059669',
                                            fontWeight: 700,
                                            fontSize: '18px'
                                        }}>
                                            ${r.price || r.raw?.price}
                                        </div>
                                    )}
                                    {(r.rating || r.raw?.average_rating) && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            color: '#f59e0b',
                                            fontWeight: 600
                                        }}>
                                            ⭐ {r.rating || r.raw?.average_rating}
                                        </div>
                                    )}
                                </div>

                                {/* Similarity Score */}
                                {r.score !== undefined && (
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#64748b',
                                        padding: '4px 8px',
                                        backgroundColor: '#f1f5f9',
                                        borderRadius: '6px',
                                        display: 'inline-block',
                                        marginBottom: '12px'
                                    }}>
                                        Match: {(r.score * 100).toFixed(1)}%
                                    </div>
                                )}

                                {/* Description */}
                                {r.raw?.description && Array.isArray(r.raw.description) && r.raw.description.length > 0 && (
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#64748b',
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {r.raw.description[0]}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add CSS animations */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}