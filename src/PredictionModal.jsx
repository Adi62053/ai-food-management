import React, { useState, useEffect } from 'react';
import './PredictionModal.css';

const PredictionModal = ({ isOpen, onClose }) => {
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch available stores
  useEffect(() => {
    if (isOpen) {
      fetchStores();
    }
  }, [isOpen]);

  const fetchStores = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/predictions/store-names');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const storesData = await response.json();
      console.log("Fetched stores:", storesData);
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchPredictions = async (storeName) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/predictions/${storeName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const predictionsData = await response.json();
      console.log("Fetched predictions:", predictionsData);
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]); // Reset predictions on error
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setPredictions([]); // Clear previous predictions
    fetchPredictions(store);
  };

  const getTrendIcon = (trend) => {
    if (!trend) return '➡️';
    
    const icons = {
      '📈 HOT': '🔥',
      '📉 SLOW': '📉', 
      '🔴 WASTE': '🚨',
      '➡️ NORMAL': '➡️'
    };
    return icons[trend] || trend;
  };

  const getTrendClass = (trend) => {
    if (!trend) return 'normal';
    
    if (trend.includes('HOT')) return 'hot';
    if (trend.includes('WASTE')) return 'waste';
    if (trend.includes('SLOW')) return 'slow';
    return 'normal';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🔮 AI Store Predictions</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Store Selection */}
        <div className="store-selection">
          <h3>Select Store:</h3>
          <div className="store-buttons">
            {stores.map((store, index) => (
              <button
                key={`store-${store}-${index}`} // Fixed: Added index to make key unique
                className={`store-btn ${selectedStore === store ? 'active' : ''}`}
                onClick={() => handleStoreSelect(store)}
              >
                🏪 {store}
              </button>
            ))}
          </div>
        </div>

        {/* Predictions Display */}
        {loading && <div className="loading">🔄 Generating AI Predictions...</div>}
        
        {predictions.length > 0 && (
          <div className="predictions-container">
            <h3>🏪 {selectedStore} - Tomorrow's Predictions</h3>
            <div className="predictions-table">
              <div className="table-header">
                <span>DISH</span>
                <span>TODAY</span>
                <span>TOMORROW</span>
                <span>TREND</span>
                <span>ADVICE</span>
              </div>
              {predictions.map((prediction, index) => (
                <div 
                  key={`prediction-${prediction.dishName}-${prediction.storeName}-${index}`} // Fixed: Added index to make key unique
                  className="prediction-row"
                >
                  <span className="dish-name">{prediction.dishName || 'N/A'}</span>
                  <span className="today-sales">{prediction.todaySales || 0}</span>
                  <span className="predicted">{prediction.predictedQuantity || 0}</span>
                  <span className={`trend ${getTrendClass(prediction.trend)}`}>
                    {getTrendIcon(prediction.trend)}
                  </span>
                  <span className="advice">{prediction.recommendation || 'Monitor sales'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && predictions.length === 0 && selectedStore && (
          <div className="no-predictions">
            No predictions available for {selectedStore}
          </div>
        )}

        {!loading && !selectedStore && (
          <div className="no-selection">
            Please select a store to view predictions
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionModal;