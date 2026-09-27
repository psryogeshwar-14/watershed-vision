import { useState, useEffect } from 'react'

const TRANSLATIONS = {
  en: {
    // Header & Brand
    brandTitle: 'Watershed',
    brandSub: 'Vision',
    ministryBadge: 'DoLR · MoRD · WDC-PMKSY',
    tagline: 'Geospatial Watershed Monitoring & Intelligence Platform',
    
    // Navigation
    navMap: 'Command Map',
    navGallery: 'Field Photos',
    navThematic: 'Thematic Maps',
    navReports: 'Audit Reports',
    
    // Ticker Stats
    tickerWatersheds: 'Watersheds Monitored',
    tickerImages: 'Geo-Tagged Photos',
    tickerNdvi: 'Avg NDVI Score',
    tickerArea: 'Area Covered (ha)',
    
    // Actions
    btnUpload: 'Upload Field Image',
    btnGenerateReport: 'Generate Audit Report',
    btnViewMap: 'View Full Map',
    btnClearFilters: 'Clear All Filters',
    btnPrintDossier: 'Print Official Dossier',
    
    // Map & Layers
    layerOsm: 'OpenStreetMap',
    layerSatellite: 'Esri Satellite',
    layerDark: 'CartoDB Dark',
    layerNdvi: 'Vegetation Index (NDVI)',
    layerNdwi: 'Water Bodies (NDWI)',
    layerDrainage: 'Drainage Network',
    layerHeatmap: 'Intervention Heatmap',
    layerImages: 'Field Survey Markers',
    
    // Dashboard & Metrics
    dashTitle: 'Watershed Analytics',
    statTotalImages: 'Total Photos',
    statArea: 'Watershed Area',
    statNdvi: 'NDVI Score',
    statWaterBodies: 'Water Bodies',
    chartNdviTitle: 'NDVI Vegetation Health Trend',
    activityBreakdown: 'Intervention Breakdown',
    healthGaugeTitle: 'Watershed Health Index',
    recentPhotos: 'Recent Field Uploads',
    
    // Anti-Spoofing & Geofence
    geofenceVerified: 'Verified Ground Truth',
    geofenceWarning: 'Potential GPS Spoof / Altitude Mismatch',
    geofenceOutOfBounds: 'Outside Registered Watershed Boundary',
    altitudeAsl: 'm Above Sea Level',
    srtmElevation: 'SRTM 30m DEM Elevation',
    
    // Intervention Classes
    check_dam: 'Check Dam / Nala Bund',
    contour_bund: 'Contour Bund / Trench',
    afforestation: 'Afforestation / Plantation',
    water_body: 'Farm Pond / Percolation Tank',
    soil_erosion: 'Soil Erosion / Gully Hotspot',
    drainage: 'Drainage Channel',
    other: 'General Intervention',
    
    // Change Detection
    swipeTitle: 'Before & After Satellite Change Detection',
    preTreatment: 'Pre-Intervention Baseline (Dry)',
    postTreatment: 'Post-Intervention Treatment (Recovered)',
    vegGain: 'Vegetation Gain',
    waterGain: 'Water Retention Gain',
    dragHint: 'Drag slider left or right to compare multi-year satellite composites',
  },
  
  hi: {
    // Header & Brand
    brandTitle: 'जलसंभर',
    brandSub: 'दृष्टि',
    ministryBadge: 'भूमि संसाधन विभाग · ग्रामीण विकास मंत्रालय',
    tagline: 'भू-स्थानिक जलसंभर विकास निगरानी एवं विश्लेषण मंच',
    
    // Navigation
    navMap: 'कमांड मैप',
    navGallery: 'फील्ड तस्वीरें',
    navThematic: 'थीमैटिक मानचित्र',
    navReports: 'ऑडिट रिपोर्ट',
    
    // Ticker Stats
    tickerWatersheds: 'कुल जलसंभर क्षेत्र',
    tickerImages: 'जियो-टैग तस्वीरें',
    tickerNdvi: 'औसत वनस्पति सूचकांक (NDVI)',
    tickerArea: 'संरक्षित क्षेत्रफल (हेक्टेयर)',
    
    // Actions
    btnUpload: 'फील्ड फोटो अपलोड करें',
    btnGenerateReport: 'ऑडिट रिपोर्ट बनाएं',
    btnViewMap: 'पूरा मैप देखें',
    btnClearFilters: 'फ़िल्टर हटाएं',
    btnPrintDossier: 'आधिकारिक रिपोर्ट प्रिंट करें',
    
    // Map & Layers
    layerOsm: 'ओपनस्ट्रीटमैप',
    layerSatellite: 'सैटेलाइट इमेजरी',
    layerDark: 'डार्क मोड मैप',
    layerNdvi: 'वनस्पति सूचकांक (NDVI)',
    layerNdwi: 'जल निकाय (NDWI)',
    layerDrainage: 'जल निकासी नेटवर्क',
    layerHeatmap: 'हॉटस्पॉट डेंसिटी मैप',
    layerImages: 'फील्ड सर्वे मार्कर',
    
    // Dashboard & Metrics
    dashTitle: 'जलसंभर विश्लेषण',
    statTotalImages: 'कुल तस्वीरें',
    statArea: 'जलसंभर क्षेत्रफल',
    statNdvi: 'वनस्पति स्वास्थ्य',
    statWaterBodies: 'जल निकाय',
    chartNdviTitle: 'वनस्पति स्वास्थ्य एवं सुधार प्रवृत्ति',
    activityBreakdown: 'कार्यवार वितरण विवरण',
    healthGaugeTitle: 'समग्र जलसंभर स्वास्थ्य सूचकांक',
    recentPhotos: 'हाल ही में अपलोड तस्वीरें',
    
    // Anti-Spoofing & Geofence
    geofenceVerified: 'प्रमाणित भू-स्थानिक सत्यता (जियोफेंस सत्यापित)',
    geofenceWarning: 'संदिग्ध GPS / ऊंचाई विसंगति चेतावनी',
    geofenceOutOfBounds: 'पंजीकृत जलसंभर सीमा से बाहर',
    altitudeAsl: 'मीटर समुद्र तल से ऊपर',
    srtmElevation: 'SRTM 30m डिजिटल एलिवेशन मॉडल',
    
    // Intervention Classes
    check_dam: 'चेक डैम / नाला बंधान',
    contour_bund: 'कंटूर बंड / खाई निर्माण',
    afforestation: 'वृक्षारोपण / वनरोपण',
    water_body: 'खेत तालाब / रिसाव टैंक',
    soil_erosion: 'मृदा अपरदन / अवनालिका क्षेत्र',
    drainage: 'प्राकृतिक जल निकासी चैनल',
    other: 'सामान्य विकास कार्य',
    
    // Change Detection
    swipeTitle: 'उपग्रह आधारित पूर्व एवं पश्चात तुलनात्मक विश्लेषण',
    preTreatment: 'कार्य प्रारंभ से पूर्व (शुष्क आधारभूत)',
    postTreatment: 'उपचार पश्चात (जल व हरियाली विस्तार)',
    vegGain: 'वनस्पति वृद्धि',
    waterGain: 'जल संग्रहण विस्तार',
    dragHint: 'उपग्रह चित्रों की तुलना करने के लिए स्लाइडर को आगे-पीछे खींचें',
  }
}

// Reactive state hook for language switching
export const useLanguage = () => {
  const [lang, setLang] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('wv_lang') || 'en' : 'en'))

  useEffect(() => {
    const handleLangChange = () => {
      setLang(typeof window !== 'undefined' ? localStorage.getItem('wv_lang') || 'en' : 'en')
    }
    window.addEventListener('languagechange', handleLangChange)
    return () => window.removeEventListener('languagechange', handleLangChange)
  }, [])

  const setLanguage = (newLang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wv_lang', newLang)
    }
    setLang(newLang)
    window.dispatchEvent(new Event('languagechange'))
  }

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key
  }

  return { lang, setLanguage, t }
}
