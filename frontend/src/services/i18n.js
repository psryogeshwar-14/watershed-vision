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
    navDrishti: 'SRISHTI-DRISHTI Sync',
    navReports: 'Audit Reports',
    
    // Ticker Stats / Hero Banner
    tickerWatersheds: 'Watersheds Monitored',
    tickerImages: 'Geo-Tagged Photos',
    tickerNdvi: 'Avg NDVI Score',
    tickerArea: 'Area Covered (ha)',
    
    // Actions & Buttons
    btnUpload: 'Upload Field Image',
    btnGenerateReport: 'Generate Audit Report',
    btnViewMap: 'View Full Map',
    btnClearFilters: 'Clear All Filters',
    btnPrintDossier: 'Print Official Dossier',
    btnExportPdf: 'Export Statutory Dossier',
    btnPrintQuick: 'Print / Quick PDF',
    btnCompiling: 'Compiling Dossier...',
    btnSubmitUpload: 'Upload & Run AI Analysis',
    btnUploading: 'Analyzing Image...',
    
    // Watershed Names & Options
    wsBhor: 'Maharashtra: Bhor Micro-Watershed (Pune)',
    wsAlwar: 'Rajasthan: Alwar Rainfed Catchment',
    wsTumkur: 'Karnataka: Tumkur Semi-Arid Basin',
    wsSelect: 'Select watershed…',
    
    // Map & Layers
    layerOsm: 'OpenStreetMap',
    layerSatellite: 'Esri Satellite Imagery',
    layerDark: 'CartoDB Dark Mode',
    layerNdvi: 'Vegetation Index (NDVI)',
    layerNdwi: 'Water Bodies (NDWI)',
    layerDrainage: 'Drainage Network (SRTM)',
    layerHeatmap: 'Intervention Heatmap',
    layerImages: 'Field Survey Markers',
    
    // Dashboard & Metrics
    dashTitle: 'Watershed Analytics',
    statTotalImages: 'Total Photos',
    statArea: 'Watershed Area',
    statNdvi: 'NDVI Score',
    statWaterBodies: 'Water Bodies',
    chartNdviTitle: 'NDVI Vegetation Health Trend',
    chartNdviSubtitle: 'Satellite-derived vegetation health over time (Sentinel-2)',
    chartMeanNdvi: 'Mean NDVI',
    chartRange: 'Min–Max Range',
    chartHealthyThreshold: 'Healthy (0.3)',
    activityBreakdown: 'Activity Breakdown',
    healthGaugeTitle: 'Watershed Health Index',
    recentPhotos: 'Recent Field Uploads',
    metricVegetation: 'Vegetation',
    metricWater: 'Water Body',
    metricInterventions: 'Interventions',
    metricMoisture: 'Soil Moisture',
    
    // Anti-Spoofing & Geofence
    geofenceVerified: 'Verified Ground Truth',
    geofenceWarning: 'Potential GPS Spoof / Altitude Mismatch',
    geofenceOutOfBounds: 'Outside Registered Watershed Boundary',
    altitudeAsl: 'm Above Sea Level',
    srtmElevation: 'SRTM 30m DEM Elevation',
    
    // Intervention Classes
    allTypes: 'All Types',
    check_dam: 'Check Dam / Nala Bund',
    contour_bund: 'Contour Bund / Trench',
    afforestation: 'Afforestation / Plantation',
    water_body: 'Water Body / Farm Pond',
    grass_land: 'Grassland / Pasture',
    farm_pond: 'Farm Pond / Percolation',
    soil_erosion: 'Soil Erosion Hotspot',
    drainage: 'Drainage Channel',
    other: 'General Intervention',
    
    // Change Detection
    swipeTitle: 'Before & After Satellite Change Detection',
    preTreatment: 'Pre-Intervention Baseline (Dry)',
    postTreatment: 'Post-Intervention Treatment (Recovered)',
    vegGain: 'Vegetation Gain',
    waterGain: 'Water Retention Gain',
    dragHint: 'Drag slider left or right to compare multi-year satellite composites',
    dryBaselineStat: 'Dry Baseline: 0.22 NDVI',
    treatedStat: 'Treated: 0.43 NDVI',

    // Thematic Maps Page
    thematicTitle: 'Thematic Maps & Satellite Products',
    thematicSub: 'Geospatial analysis products derived from Sentinel-2 satellite imagery and field data aligned with SRISHTI-DRISHTI objectives.',
    analysisPeriod: 'Analysis Period:',
    targetWatershed: 'Target Watershed:',
    activeProducts: 'Active Products',
    availableThematic: 'Available Thematic Products',
    availableThematicSub: 'Sentinel-2 MSI & SRTM DEM analytical layers ready for GIS export',
    periodKharif: 'Jun–Sep 2024 (Kharif / Monsoon)',
    periodRabi: 'Oct–Jan 2024 (Rabi / Post-Monsoon)',
    periodSummer: 'Feb–May 2024 (Summer / Pre-Monsoon)',
    periodFullYear: 'Full Year 2024',
    viewOnMap: 'View on Map',
    downloadGeotiff: 'Download GeoTIFF',

    // Thematic Map Cards
    mapLulcTitle: 'Land Use / Land Cover (LULC)',
    mapLulcDesc: 'Classification of land into agriculture, forest, water bodies, built-up, and barren categories based on Sentinel-2 imagery.',
    mapNdviTitle: 'Vegetation Index Map (NDVI)',
    mapNdviDesc: 'Normalized Difference Vegetation Index showing vegetation canopy density and vigor across the watershed.',
    mapWaterTitle: 'Water Body Extent Map (NDWI)',
    mapWaterDesc: 'Mapping of surface water bodies including ponds, check dams, percolation tanks, and reservoirs using NDWI.',
    mapDrainageTitle: 'Drainage Network Map',
    mapDrainageDesc: 'Automated delineation of stream orders and drainage basins derived from SRTM 30m Digital Elevation Model.',
    mapMoistureTitle: 'Soil Moisture Index (MNDWI)',
    mapMoistureDesc: 'Estimated surface soil moisture derived from shortwave-infrared Sentinel-2 bands.',
    mapHeatmapTitle: 'Intervention Heatmap (KDE)',
    mapHeatmapDesc: 'Kernel density estimation of geo-tagged field photos displaying intensity of ground civil interventions.',

    // Image Gallery Page
    galleryTitle: 'Field Image Gallery',
    gallerySub: 'Browse and inspect geo-coded field photographs. Each image is verified with GPS coordinates and AI-classified.',
    aiConfidence: 'AI Confidence',
    noImagesFound: 'No images match the current filter criteria.',
    filterByType: 'Filter by Activity Type',
    searchPlaceholder: 'Search by label or coordinates...',

    // Upload Modal
    uploadTitle: 'Upload Geo-Tagged Field Image',
    uploadSub: 'Supports JPEG, PNG, HEIC up to 20MB. GPS coordinates and altitude extracted automatically from EXIF metadata.',
    dragDropText: 'Drag & drop images here',
    clickBrowse: 'or click to browse from device',
    selectWatershedLabel: 'Watershed Catchment *',
    selectActivityLabel: 'Activity Type *',
    latitudeLabel: 'Latitude (auto from EXIF)',
    longitudeLabel: 'Longitude (auto from EXIF)',
  },
  
  hi: {
    // Header & Brand
    brandTitle: 'जलसंभर',
    brandSub: 'दृष्टि',
    ministryBadge: 'भूमि संसाधन विभाग · ग्रामीण विकास मंत्रालय · WDC-PMKSY',
    tagline: 'भू-स्थानिक जलसंभर विकास निगरानी एवं निर्णय समर्थन मंच',
    
    // Navigation
    navMap: 'कमांड मैप',
    navGallery: 'फील्ड तस्वीरें',
    navThematic: 'थीमैटिक मानचित्र',
    navDrishti: 'सृष्टि-दृष्टि सिंक',
    navReports: 'ऑडिट रिपोर्ट',
    
    // Ticker Stats / Hero Banner
    tickerWatersheds: 'कुल जलसंभर क्षेत्र',
    tickerImages: 'जियो-टैग तस्वीरें',
    tickerNdvi: 'औसत वनस्पति सूचकांक (NDVI)',
    tickerArea: 'संरक्षित क्षेत्रफल (हेक्टेयर)',
    
    // Actions & Buttons
    btnUpload: 'फील्ड फोटो अपलोड करें',
    btnGenerateReport: 'ऑडिट रिपोर्ट बनाएं',
    btnViewMap: 'पूरा मैप देखें',
    btnClearFilters: 'फ़िल्टर हटाएं',
    btnPrintDossier: 'आधिकारिक रिपोर्ट प्रिंट करें',
    btnExportPdf: 'आधिकारिक डोजियर एक्सपोर्ट',
    btnPrintQuick: 'प्रिंट / पीडीएफ',
    btnCompiling: 'डोजियर तैयार हो रहा है...',
    btnSubmitUpload: 'अपलोड एवं एआई विश्लेषण करें',
    btnUploading: 'विश्लेषण हो रहा है...',
    
    // Watershed Names & Options
    wsBhor: 'महाराष्ट्र: भोर सूक्ष्म-जलसंभर (पुणे)',
    wsAlwar: 'राजस्थान: अलवर वर्षा-आधारित जलसंभर',
    wsTumkur: 'कर्नाटक: तुमकुर अर्ध-शुष्क बेसिन',
    wsSelect: 'जलसंभर चुनें…',
    
    // Map & Layers
    layerOsm: 'ओपनस्ट्रीटमैप',
    layerSatellite: 'सैटेलाइट इमेजरी',
    layerDark: 'डार्क मोड मैप',
    layerNdvi: 'वनस्पति सूचकांक (NDVI)',
    layerNdwi: 'जल निकाय (NDWI)',
    layerDrainage: 'जल निकासी नेटवर्क (SRTM)',
    layerHeatmap: 'हॉटस्पॉट डेंसिटी मैप',
    layerImages: 'फील्ड सर्वे मार्कर',
    
    // Dashboard & Metrics
    dashTitle: 'जलसंभर विश्लेषण',
    statTotalImages: 'कुल तस्वीरें',
    statArea: 'जलसंभर क्षेत्रफल',
    statNdvi: 'वनस्पति स्वास्थ्य (NDVI)',
    statWaterBodies: 'जल निकाय',
    chartNdviTitle: 'वनस्पति स्वास्थ्य एवं सुधार प्रवृत्ति',
    chartNdviSubtitle: 'उपग्रह आधारित समय-शृंखला वनस्पति सूचकांक (सेंटिनल-2)',
    chartMeanNdvi: 'औसत NDVI',
    chartRange: 'न्यूनतम–अधिकतम दायरा',
    chartHealthyThreshold: 'स्वस्थ वनस्पति सीमा (0.3)',
    activityBreakdown: 'कार्यवार वितरण विवरण',
    healthGaugeTitle: 'समग्र जलसंभर स्वास्थ्य सूचकांक',
    recentPhotos: 'हाल ही में अपलोड तस्वीरें',
    metricVegetation: 'वनस्पति आवरण',
    metricWater: 'जल संरक्षण',
    metricInterventions: 'विकास कार्य',
    metricMoisture: 'मृदा नमी',
    
    // Anti-Spoofing & Geofence
    geofenceVerified: 'प्रमाणित भू-स्थानिक सत्यता (जियोफेंस सत्यापित)',
    geofenceWarning: 'संदिग्ध GPS / ऊंचाई विसंगति चेतावनी',
    geofenceOutOfBounds: 'पंजीकृत जलसंभर सीमा से बाहर',
    altitudeAsl: 'मीटर समुद्र तल से ऊपर',
    srtmElevation: 'SRTM 30m डिजिटल एलिवेशन मॉडल',
    
    // Intervention Classes
    allTypes: 'सभी कार्य प्रकार',
    check_dam: 'चेक डैम / नाला बंधान',
    contour_bund: 'कंटूर बंड / खाई निर्माण',
    afforestation: 'वृक्षारोपण / वनरोपण',
    water_body: 'जल निकाय / तालाब',
    grass_land: 'घास का मैदान / चारागाह',
    farm_pond: 'खेत तालाब (फार्म पॉन्ड)',
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
    dryBaselineStat: 'शुष्क आधारभूत: 0.22 NDVI',
    treatedStat: 'उपचार पश्चात: 0.43 NDVI',

    // Thematic Maps Page
    thematicTitle: 'थीमैटिक मानचित्र एवं उपग्रह विश्लेषण',
    thematicSub: 'सेंटिनल-2 उपग्रह इमेजरी और फील्ड डेटा से तैयार किए गए भू-स्थानिक उत्पाद (सृष्टि-दृष्टि के अनुरूप)।',
    analysisPeriod: 'विश्लेषण अवधि:',
    targetWatershed: 'लक्षित जलसंभर:',
    activeProducts: 'सक्रिय उत्पाद',
    availableThematic: 'उपलब्ध थीमैटिक उत्पाद',
    availableThematicSub: 'सेंटिनल-2 एवं SRTM DEM आधारित जीआईएस परतें डाउनलोड के लिए तैयार',
    periodKharif: 'जून-सितंबर 2024 (खरीफ / मानसून)',
    periodRabi: 'अक्टूबर-जनवरी 2024 (रबी / पोस्ट-मानसून)',
    periodSummer: 'फरवरी-मई 2024 (ग्रीष्म / प्री-मानसून)',
    periodFullYear: 'सम्पूर्ण वर्ष 2024',
    viewOnMap: 'मैप पर देखें',
    downloadGeotiff: 'जियोटिफ डाउनलोड',

    // Thematic Map Cards
    mapLulcTitle: 'भूमि उपयोग / भूमि आवरण (LULC)',
    mapLulcDesc: 'सेंटिनल-2 इमेजरी के आधार पर कृषि, वन, जल निकाय, निर्मित क्षेत्र और बंजर भूमि का वर्गीकरण।',
    mapNdviTitle: 'वनस्पति सूचकांक मानचित्र (NDVI)',
    mapNdviDesc: 'जलसंभर में वनस्पति स्वास्थ्य और हरियाली के घनत्व को दर्शाने वाला सूचकांक।',
    mapWaterTitle: 'जल निकाय विस्तार मानचित्र (NDWI)',
    mapWaterDesc: 'NDWI स्पेक्ट्रल इंडेक्स का उपयोग करके तालाबों, चेक डैम, रिसाव टैंकों और नदियों का मानचित्रण।',
    mapDrainageTitle: 'जल निकासी नेटवर्क मानचित्र',
    mapDrainageDesc: 'SRTM 30m डिजिटल एलिवेशन मॉडल (DEM) विश्लेषण से स्वचालित जलधारा नेटवर्क निर्धारण।',
    mapMoistureTitle: 'मृदा नमी सूचकांक (MNDWI)',
    mapMoistureDesc: 'सेंटिनल-2 बैंड से प्राप्त उप-सतह नमी की स्थिति का डिजिटल आकलन।',
    mapHeatmapTitle: 'विकास कार्य हॉटस्पॉट मानचित्र (KDE)',
    mapHeatmapDesc: 'फील्ड तस्वीरों के जियो-टैग के आधार पर जलसंभर विकास कार्यों के घनत्व का मानचित्रण।',

    // Image Gallery Page
    galleryTitle: 'फील्ड फोटो गैलरी',
    gallerySub: 'जियो-टैग फील्ड तस्वीरों को देखें और विश्लेषित करें। प्रत्येक तस्वीर का एआई द्वारा स्वतः वर्गीकरण किया गया है।',
    aiConfidence: 'एआई विश्वसनीयता',
    noImagesFound: 'फ़िल्टर के अनुसार कोई तस्वीर नहीं मिली।',
    filterByType: 'कार्य प्रकार अनुसार चुनें',
    searchPlaceholder: 'लेबल या निर्देशांक खोजें...',

    // Upload Modal
    uploadTitle: 'जियो-टैग फील्ड फोटो अपलोड करें',
    uploadSub: 'JPEG, PNG, HEIC (अधिकतम 20MB)। EXIF मेटाडेटा से GPS निर्देशांक और ऊंचाई स्वतः प्राप्त होगी।',
    dragDropText: 'फोटो यहाँ ड्रैग और ड्रॉप करें',
    clickBrowse: 'या डिवाइस से फ़ाइल चुनने के लिए क्लिक करें',
    selectWatershedLabel: 'जलसंभर क्षेत्र *',
    selectActivityLabel: 'कार्य का प्रकार *',
    latitudeLabel: 'अक्षांश (Latitude - स्वतः)',
    longitudeLabel: 'देशांतर (Longitude - स्वतः)',
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
