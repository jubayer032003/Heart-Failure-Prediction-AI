import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [result, setResult] = useState(null);
  const [probability, setProbability] = useState(0);
  const [shapValues, setShapValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('prediction');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    Age: "",
    Sex: "M",
    ChestPainType: "ATA",
    RestingBP: "",
    Cholesterol: "",
    FastingBS: 0,
    RestingECG: "Normal",
    MaxHR: "",
    ExerciseAngina: "N",
    Oldpeak: "",
    ST_Slope: "Up"
  });

  // Risk thresholds for color coding
  const riskColors = {
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#ef4444'
  };

  const getRiskLevel = (prob) => {
    if (prob < 0.3) return { level: 'Low Risk', color: riskColors.low };
    if (prob < 0.6) return { level: 'Moderate Risk', color: riskColors.moderate };
    return { level: 'High Risk', color: riskColors.high };
  };

  // Toggle dark mode with animation
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load prediction history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('predictionHistory');
    if (saved) {
      setPredictionHistory(JSON.parse(saved));
    }
  }, []);

  const addNotification = (message, type) => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", formData);
      setResult(res.data.result);
      setProbability(res.data.probability);

      const shapRes = await axios.post("http://127.0.0.1:8000/explain", formData);
      setShapValues(shapRes.data.shap_values);

      // Save to history
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        probability: res.data.probability,
        result: res.data.result,
        formData: { ...formData }
      };
      
      const updatedHistory = [newEntry, ...predictionHistory].slice(0, 10);
      setPredictionHistory(updatedHistory);
      localStorage.setItem('predictionHistory', JSON.stringify(updatedHistory));
      
      addNotification('Prediction completed successfully!', 'success');
      
    } catch (error) {
      addNotification('Failed to connect to the server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ result, probability, shapValues, formData }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `heart-risk-prediction-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    addNotification('Data exported successfully!', 'success');
  };

  const riskInfo = probability ? getRiskLevel(probability) : null;
  const riskLevel = riskInfo?.level || 'No Risk Data';

  return (
    <div className="min-h-screen text-gray-900 dark:text-white bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30 dark:opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-indigo-200 dark:bg-indigo-900"
              style={{
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <svg className="w-8 h-8 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Heart failure Prediction AI
              </h1>
            </motion.div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex space-x-4">
              {['prediction', 'history', 'insights'].map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  )}
                </motion.button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notif => (
                            <div
                              key={notif.id}
                              className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                                notif.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                                notif.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' : ''
                              }`}
                            >
                              <p className="text-sm">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
                            </div>
                          ))
                        ) : (
                          <p className="p-4 text-center text-gray-500">No notifications</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300"
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'prediction' && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Input Form */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3 mb-8">
                  <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Patient Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    name="Age" 
                    placeholder="Age (years)" 
                    icon="👤"
                    value={formData.Age}
                    onChange={handleChange}
                  />
                  <Input 
                    name="RestingBP" 
                    placeholder="Resting BP (mmHg)" 
                    icon="💓"
                    value={formData.RestingBP}
                    onChange={handleChange}
                  />
                  <Input 
                    name="Cholesterol" 
                    placeholder="Cholesterol (mg/dL)" 
                    value={formData.Cholesterol}
                    onChange={handleChange}
                  />
                  <Input 
                    name="MaxHR" 
                    placeholder="Max Heart Rate" 
                    value={formData.MaxHR}
                    onChange={handleChange}
                  />
                  <Input 
                    name="Oldpeak" 
                    placeholder="ST Depression" 
                    icon=""
                    value={formData.Oldpeak}
                    onChange={handleChange}
                  />

                  <Select 
                    name="Sex" 
                    value={formData.Sex}
                    options={[
                      { value: "M", label: "Male " },
                      { value: "F", label: "Female" }
                    ]} 
                    onChange={handleChange}
                  />
                  
                  <Select 
                    name="ChestPainType" 
                    value={formData.ChestPainType}
                    options={[
                      { value: "ATA", label: "Atypical Angina" },
                      { value: "NAP", label: "Non-Anginal Pain" },
                      { value: "ASY", label: "Asymptomatic" },
                      { value: "TA", label: "Typical Angina" }
                    ]} 
                    onChange={handleChange}
                  />
                  
                  <Select 
                    name="FastingBS" 
                    value={formData.FastingBS}
                    options={[
                      { value: 0, label: "Normal (< 126 mg/dL)" },
                      { value: 1, label: "High (> 126 mg/dL)" }
                    ]} 
                    onChange={handleChange}
                  />
                  
                  <Select 
                    name="RestingECG" 
                    value={formData.RestingECG}
                    options={[
                      { value: "Normal", label: "Normal" },
                      { value: "ST", label: "ST-T Wave Abnormality" },
                      { value: "LVH", label: "Left Ventricular Hypertrophy" }
                    ]} 
                    onChange={handleChange}
                  />
                  
                  <Select 
                    name="ExerciseAngina" 
                    value={formData.ExerciseAngina}
                    options={[
                      { value: "N", label: "No" },
                      { value: "Y", label: "Yes" }
                    ]} 
                    onChange={handleChange}
                  />
                  
                  <Select 
                    name="ST_Slope" 
                    value={formData.ST_Slope}
                    options={[
                      { value: "Up", label: "Upsloping" },
                      { value: "Flat", label: "Flat" },
                      { value: "Down", label: "Downsloping" }
                    ]} 
                    onChange={handleChange}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <>
                      <span className="relative z-10">Predict Heart Risk</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600"
                        initial={{ x: "100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Results Section */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
                >
                  {/* Risk Indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <h2 className="text-2xl font-bold">Risk Assessment</h2>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleExportData}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Risk Level Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-center p-4 rounded-2xl mb-6 ${
                      riskLevel.includes('Low') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      riskLevel.includes('Moderate') ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <h3 className="text-xl font-bold">{riskLevel}</h3>
                    <p className="text-sm mt-1">Based on AI analysis of patient data</p>
                  </motion.div>

                  {/* Gauge and Probability */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="w-40 mx-auto">
                      <CircularProgressbar
                        value={probability * 100}
                        text={`${(probability * 100).toFixed(0)}%`}
                        styles={buildStyles({
                          textSize: '16px',
                          pathColor: riskInfo?.color || riskColors.moderate,
                          textColor: darkMode ? '#fff' : '#333',
                          trailColor: darkMode ? '#374151' : '#e5e7eb'
                        })}
                      />
                    </div>

                    <div className="flex flex-col justify-center">
                      <p className="text-gray-600 dark:text-white mb-2">Risk Probability</p>
                      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${probability * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute h-full rounded-full"
                          style={{ backgroundColor: riskInfo?.color }}
                        />
                      </div>
                      
                      {/* Risk scale */}
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Low Risk</span>
                        <span>Moderate</span>
                        <span>High Risk</span>
                      </div>
                    </div>
                  </div>

                  {/* SHAP Feature Impact */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Feature Impact Analysis</h3>
                      <div className="relative group">
                        <svg className="w-5 h-5 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                          How each factor affects the risk prediction
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {shapValues
                        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                        .map((item, index) => {
                          const width = Math.min(Math.abs(item.value) * 100, 100);
                          const isIncrease = item.value > 0;
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="relative"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm">{item.feature}</span>
                                <span className={`text-sm font-semibold ${
                                  isIncrease ? 'text-red-500' : 'text-green-500'
                                }`}>
                                  {isIncrease ? '+' : ''}{item.value.toFixed(3)}
                                </span>
                              </div>
                              
                              <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${width}%` }}
                                  transition={{ duration: 0.5, delay: index * 0.1 }}
                                  className={`absolute h-full ${
                                    isIncrease ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-green-400 to-green-600'
                                  }`}
                                />
                                <div className="absolute inset-0 flex items-center px-3 text-white mix-blend-difference">
                                  <span className="text-xs">
                                    {isIncrease ? '↑ Increases risk' : '↓ Decreases risk'}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      className="flex-1 py-2 px-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                    >
                      Recalculate
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab('history')}
                      className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      View History
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-2xl font-bold">Prediction History</h2>
                </div>
                
                {predictionHistory.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setPredictionHistory([]);
                      localStorage.removeItem('predictionHistory');
                      addNotification('History cleared', 'info');
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                  >
                    Clear History
                  </motion.button>
                )}
              </div>

              {predictionHistory.length > 0 ? (
                <div className="space-y-4">
                  {predictionHistory.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition cursor-pointer"
                      onClick={() => {
                        setFormData(entry.formData);
                        setProbability(entry.probability);
                        setResult(entry.result);
                        setActiveTab('prediction');
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">{entry.timestamp}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              entry.probability < 0.3 ? 'bg-green-100 text-green-700' :
                              entry.probability < 0.6 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {(entry.probability * 100).toFixed(1)}% Risk
                            </div>
                            <span className="text-gray-600 dark:text-gray-300">
                              Age: {entry.formData.Age}
                            </span>
                          </div>
                        </div>
                        <svg className={`w-6 h-6 ${
                          entry.probability < 0.3 ? 'text-green-500' :
                          entry.probability < 0.6 ? 'text-yellow-500' :
                          'text-red-500'
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-500">No prediction history yet</p>
                  <p className="text-sm text-gray-400 mt-2">Make your first prediction to see it here</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && predictionHistory.length > 0 && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-8">Risk Insights & Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Risk Distribution - Simple Stats */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Low Risk', count: predictionHistory.filter(h => h.probability < 0.3).length, color: 'bg-green-500' },
                      { name: 'Moderate Risk', count: predictionHistory.filter(h => h.probability >= 0.3 && h.probability < 0.6).length, color: 'bg-yellow-500' },
                      { name: 'High Risk', count: predictionHistory.filter(h => h.probability >= 0.6).length, color: 'bg-red-500' }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.name}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full`} 
                            style={{ width: `${(item.count / predictionHistory.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Stats */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Risk Statistics</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Average Risk</p>
                      <p className="text-2xl font-bold">
                        {(predictionHistory.reduce((acc, curr) => acc + curr.probability, 0) / predictionHistory.length * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Highest Risk</p>
                      <p className="text-2xl font-bold text-red-500">
                        {Math.max(...predictionHistory.map(h => h.probability * 100)).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lowest Risk</p>
                      <p className="text-2xl font-bold text-green-500">
                        {Math.min(...predictionHistory.map(h => h.probability * 100)).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>HeartRisk AI - Advanced Cardiovascular Risk Assessment Tool</p>
          <p className="mt-2">© 2026 All rights reserved. Developed By Jubayer rahman Chowdhury .</p>
        </div>
      </footer>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
}

/* Enhanced Input Component */
function Input({ name, placeholder, icon, value, onChange }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <motion.div
      initial={false}
      animate={focused ? { scale: 1.02 } : { scale: 1 }}
      className="relative"
    >
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
      <input
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full p-3 ${icon ? 'pl-10' : 'pl-3'} pr-3 border-2 rounded-xl focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 ${
          focused ? 'border-indigo-500 dark:border-indigo-400' : 'border-gray-200 dark:border-gray-600'
        }`}
      />
    </motion.div>
  );
}

/* Enhanced Select Component */
function Select({ name, value, options, onChange }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <motion.div
      animate={focused ? { scale: 1.02 } : { scale: 1 }}
    >
      <select
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full p-3 border-2 rounded-xl focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 ${
          focused ? 'border-indigo-500 dark:border-indigo-400' : 'border-gray-200 dark:border-gray-600'
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </motion.div>
  );
}

export default App;