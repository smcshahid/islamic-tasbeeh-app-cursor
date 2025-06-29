# Quick Production Testing Guide

## 🚀 **Immediate Testing Steps**

### **1. Verify Production Mode is Active**

Run the app and check for these indicators:

✅ **Production Mode Indicators:**
- Prayer times show **real current dates** (not June 2025 sample data)
- Location shows your **actual city/country** 
- Prayer times match your **local timezone**
- "Today" button shows **actual today's date**

❌ **Sample Mode Indicators (should NOT see):**
- Dates locked to June 2025
- London, UK as default location
- Demo/sample data messages

### **2. Test Location Services**

#### **GPS Location Test:**
1. Go to Prayer Times screen
2. Tap Settings → Location
3. Try "Auto Location" 
4. **Expected**: Permission prompt → GPS coordinates → Real prayer times for your location

#### **Manual Location Test:**
1. Go to Settings → Location 
2. Try "Manual Location"
3. Select different cities from the list
4. **Expected**: Prayer times update immediately for selected city

### **3. Test API Connectivity**

#### **Online Test:**
1. Ensure internet connection
2. Navigate to different dates (±1 week)
3. **Expected**: Prayer times load within 5-10 seconds for new dates

#### **Offline Test:**
1. Turn off WiFi/mobile data
2. Navigate between dates in current month
3. **Expected**: Cached data loads instantly
4. **Expected**: Clear "Offline" indicator in header

### **4. Test Date Navigation**

#### **Basic Navigation:**
1. Use ← → arrows to navigate days
2. Test "Today" button
3. **Expected**: Real dates, not sample June 2025 dates

#### **Month Boundaries:**
1. Navigate to end of current month
2. Try going to next month
3. **Expected**: API call for new month, loading indicator

### **5. Test Error Handling**

#### **Network Error Test:**
1. Turn off internet
2. Try navigating to a new month (not cached)
3. **Expected**: Clear error message about connectivity
4. **Expected**: Option to retry when internet restored

#### **Invalid Date Test:**
1. Try navigating far into the future (>1 year)
2. **Expected**: Validation message preventing invalid navigation

---

## 🔍 **What to Look For**

### ✅ **Signs Everything is Working:**
- Real prayer times for your location
- Current date as "Today"
- Location shows your city
- Smooth navigation between dates
- Offline mode works with cached data
- Clear error messages when needed

### ❌ **Signs Something Needs Fixing:**
- Still showing June 2025 dates
- London as default location
- "Sample data" error messages
- API timeouts or connection errors
- No location permission prompts

---

## 🛠 **Troubleshooting Common Issues**

### **Issue: Still Showing Sample Data**
**Solution:** 
1. Refresh/restart the app completely
2. Check that `USE_SAMPLE_DATA = false` in `aladhanApi.ts`
3. Clear app cache if needed

### **Issue: Location Permission Denied**
**Solution:**
1. Go to device Settings → Apps → Tasbeeh App → Permissions
2. Enable Location permission
3. Try auto-location again

### **Issue: API Timeout/Connection Errors**
**Solution:**
1. Check internet connection
2. Try different network (WiFi vs mobile data)
3. Wait a moment and retry (API might be temporarily busy)

### **Issue: Wrong Prayer Times**
**Solution:**
1. Verify location is correct
2. Check calculation method in settings
3. Compare with other reliable sources for your location

---

## 📊 **Expected Performance**

### **API Response Times:**
- **First load**: 5-15 seconds (fetching full month)
- **Cached data**: Instant (<1 second)
- **Month navigation**: 3-10 seconds for new month

### **Location Services:**
- **GPS acquisition**: 5-30 seconds (depending on device/signal)
- **Manual selection**: Instant
- **Location updates**: Triggered on 5km+ movement

### **Offline Behavior:**
- **Current month**: Full offline support
- **Other months**: Shows cached data or clear error message
- **Connectivity**: Real-time online/offline detection

---

## 🎯 **Success Criteria**

✅ **Production Mode Successfully Enabled If:**

1. **Real Data**: Prayer times show for actual current date and location
2. **Location Works**: Both GPS and manual location selection functional
3. **API Integration**: Live data loading with proper error handling
4. **Caching Works**: Fast navigation within cached months
5. **Offline Support**: Graceful degradation when no internet
6. **User Experience**: Smooth, responsive interface with clear feedback

---

## 📞 **Next Steps After Testing**

### **If Everything Works:**
1. ✅ Production mode is successfully enabled
2. ✅ Ready for broader testing with different locations
3. ✅ Consider enabling for beta users/testers
4. ✅ Start planning additional features (Qibla, analytics, etc.)

### **If Issues Found:**
1. 🔧 Check the troubleshooting section above
2. 🔧 Review API credentials and endpoints
3. 🔧 Test with different devices/locations
4. 🔧 Check logs for specific error messages

---

**Happy Testing! 🚀** Your prayer times app is now ready for real-world usage with live API data. 