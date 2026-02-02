import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Text, View, Image, TouchableOpacity, Linking, Dimensions, Alert, useWindowDimensions, LayoutAnimation, Animated, Platform } from 'react-native';
import RenderHtml from 'react-native-render-html';
import ImageView from 'react-native-image-viewing'; // Replaces PhotoView
import Hyperlink from 'react-native-hyperlink';
import { Button } from 'react-native-elements'; 
import ViewPdf from './ViewPdf';

// Using context instead of connect
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';


const SqlMessageItem = ({ item }) => {
  const { width: contentWidth } = useWindowDimensions();
  const context = useContext(CoreContext);
  const styleContext = useContext(StyleContext);
  const { role, owner, deleteMessage, processConcessionRequest, processReceiptCancelRequest, markMessageAsRead } = context;

  const [source, setSource] = useState({ uri: 'https://via.placeholder.com/50' });
  const [isModalImageVisible, setIsModalImageVisible] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(item?.concessionApprovalStatus);
  const [isExpanded, setIsExpanded] = useState(item.isread === 'yes');

  // Helper derived state for title color
  const getTitleColor = () => {
      const { dat, priority } = item;
      
      // 1. Priority check
      if (priority === '1') return 'red';

      // 2. Date check (Today)
      if (dat) {
        const fullDate = dat.split(' ');
        const dateStr = fullDate[0];
        
        const d = new Date();
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        const todayStr = `${year}-${month}-${day}`;
        if (todayStr === dateStr) return 'blue';
      }

      // 3. Global Default
      return styleContext?.titleColor || '#000';
  };

  const titleColor = getTitleColor();
  const [readerCount, setReaderCount] = useState(''); // Stub for now or fetch if needed

  // Initial Image Loader Logic
  useEffect(() => {
    if (item.filepath) {
        // Ensure no double slash if appUrl ends with /
        const baseUrl = context.appUrl.endsWith('/') ? context.appUrl.slice(0, -1) : context.appUrl;
        const path = item.filepath.startsWith('/') ? item.filepath : `/${item.filepath}`;
        const file = `${baseUrl}${path}`;
        setSource({ uri: file });
    }
  }, [item, context.appUrl]);

  const confirmMessagePrompt = (action) => {
    let message = '';
    if (action === 'delete-message') message = 'Message will be deleted permanently..';
    if (action === 'decline-concession') message = 'Concession request will be declined..';
    if (action === 'approve-concession') message = 'Concession request will be approved..';
    if (action === 'approve-receipt-cancellation') message = 'Receipt will be cancelled ..';
    if (action === 'decline-receipt-cancellation') message = 'Receipt will not be cancelled ..';

    Alert.alert(
      'Warning',
      message,
      [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'OK', onPress: () => onButtonPress(action) }
      ]
    );
  };

  const onButtonPress = async (action) => {
    if (action === 'delete-message') {
        if(deleteMessage) deleteMessage(item.id);
    }
    else if (action === 'decline-concession') {
      const success = await processConcessionRequest(item.topicid, 'declined');
      if(success) setApprovalStatus('declined');
    }
    else if (action === 'approve-concession') {
      const success = await processConcessionRequest(item.topicid, 'approved');
      if(success) setApprovalStatus('approved');
    }
    else if (action === 'decline-receipt-cancellation') {
      await handleProcessReceiptCancelRequest(item.topicid, 'declined');
    }
    else if (action === 'approve-receipt-cancellation') {
      await handleProcessReceiptCancelRequest(item.topicid, 'approved');
    }
  };

  const handleProcessReceiptCancelRequest = async (requestId, action) => {
      const contentStr = item.content || '';
      const content1 = contentStr.split('Reason :');
      let contentVal = '';
      let byVal = '';
      
      if (content1.length > 1) {
          const content2 = content1[1].split('by');
          contentVal = content2[0];
          byVal = content2[1];
      }
      
      const success = await processReceiptCancelRequest(requestId, action, contentVal, byVal);
      if (success) {
          setApprovalStatus(action);
      }
  };

  const onViewButtonPress = (mt) => {
    console.log('Navigate to:', mt);
  };

  const onResendButtonPress = () => {
     console.log('Forward pressed'); 
  };
  
  const onReaderButtonPress = () => {
    console.log('Viewers pressed');
  };
  
  const renderReSendButton = (aStatus = 'approved', msgType = '') => {
    if (role === 'admin' || role === 'super' || role === 'tech' || role === 'principal' || owner === item.owner) {
       const commonButtonStyle = { borderRadius: 20, paddingHorizontal: 15, height: 35, marginHorizontal: 4 };
       const titleStyle = { fontSize: 13, fontWeight: 'bold' };

       if (aStatus === 'raised' && msgType === 'receipt-cancellation')
        return (<Button
          title="Approve"
          buttonStyle={{ ...commonButtonStyle, backgroundColor: styleContext?.colors?.success || '#388e3c' }}
          titleStyle={titleStyle}
          onPress={() => confirmMessagePrompt('approve-receipt-cancellation')}
        />);

       if (aStatus === 'raised')
        return (<Button
          title="Approve"
          buttonStyle={{ ...commonButtonStyle, backgroundColor: styleContext?.colors?.success || '#388e3c' }}
          titleStyle={titleStyle}
          onPress={() => confirmMessagePrompt('approve-concession')}
        />);

       if (msgType === 'leave-application' || msgType === 'leave-application-processed' || msgType === 'discipline-profile')
        return (<Button
          title="View"
          buttonStyle={{ ...commonButtonStyle, backgroundColor: styleContext?.colors?.info || '#1976d2' }}
          titleStyle={titleStyle}
          onPress={() => onViewButtonPress(msgType)}
        />);

       return (<Button
          title="Forward"
          buttonStyle={{ ...commonButtonStyle, backgroundColor: styleContext?.colors?.info || '#1976d2' }}
          titleStyle={titleStyle}
          onPress={onResendButtonPress}
       />);
    }
    return null;
  };

  const renderDeliveryReport = (tim) => {
     if (role === 'student') return null; 
     if (role === 'tech' || role === 'super' || role === 'admin' || role === 'principal' || owner === item.owner) {
         return <Button
            title={`${readerCount || 0} devices`}
            type="outline"
            buttonStyle={{ borderRadius: 50, borderColor: styleContext?.colors?.success || '#388e3c', borderWidth: 1, paddingHorizontal: 15, height: 35 }}
            titleStyle={{ fontSize: 12, color: styleContext?.colors?.success || '#388e3c' }}
            onPress={onReaderButtonPress}
         />;
     }
     return null;
  };

  const renderDelButton = (aStatus = 'approved', msgType = '') => {
     if (role === 'admin' || role === 'super' || role === 'tech' || role === 'principal' || owner === item.owner) {
        const commonButtonStyle = { borderRadius: 20, paddingHorizontal: 15, height: 35, marginHorizontal: 4 };
        const titleStyle = { fontSize: 13, fontWeight: 'bold' };

       if (aStatus === 'raised' && msgType === 'receipt-cancellation')
        return (<Button
          title="Decline"
          buttonStyle={{ ...commonButtonStyle, backgroundColor: styleContext?.colors?.error || '#d32f2f' }}
          titleStyle={titleStyle}
          onPress={() => confirmMessagePrompt('decline-receipt-cancellation')}
        />);

       if (aStatus === 'raised')
        return (<Button
          title="Decline"
          buttonStyle={{ ...commonButtonStyle, backgroundColor: styleContext?.colors?.error || '#d32f2f' }}
          titleStyle={titleStyle}
          onPress={() => confirmMessagePrompt('decline-concession')}
        />);

       return (<Button
        title="Delete"
        buttonStyle={{ ...commonButtonStyle, backgroundColor: styleContext?.colors?.error || '#d32f2f' }}
        titleStyle={titleStyle}
        onPress={() => confirmMessagePrompt('delete-message')}
       />);
    }
    return null;
  };

  const deliveryReportStudent = (tim) => {
    if (role === 'student') {
      return <View style={{ flexDirection: 'row', justifyContent: 'center' }} >
        <Text style={{ fontSize: 10, color: '#007aff', fontWeight: 'bold' }}>
          {tim}
        </Text>
      </View>;
    } else return null;
  };
  
  // Render Data Preparation
  const { title, dat, msgSentDate, filepath, name, rtime, filepaths } = item; 

  let content = item.concessionApprovalStatus ? item.content + ' : ' + approvalStatus : item.content;
  let by = '';
  // Use context owner if available, otherwise phone, otherwise 'Admin'
  const currentOwner = owner || context.phone || 'Admin';
  const messageSender = name || 'User';

  if (role === 'admin' || role === 'super' || role === 'principal' || role === 'tech') {
    by = ` By ${currentOwner}, ${messageSender}`;
  } else {
    by = `By ${messageSender}`;
  }
  const deliveryText = item.msg_type === 'declaration' ? 'Accepted on' : 'Read on';
  const tim = rtime ? `${deliveryText} ${rtime}` : '';

  let showImages = true;
  if (item.priority == '2' && item.cd > 0) {
      showImages = false;
      content = 'The content of this Message is not visible to you, this may be with respect to the fee payment issues, Please contact your school for a resolution.';
  }

  // File / PDF / Album Logic
  let file = filepath;
  let fileExtension = '';
  let pdfUrl = '';
  
  if (file) {
      const parts = file.split('.');
      fileExtension = parts.pop();
  }

  if (file && (fileExtension.toLowerCase() === 'pdf')) {
      const baseUrl = context.appUrl.endsWith('/') ? context.appUrl.slice(0, -1) : context.appUrl;
      const path = file.startsWith('/') ? file : `/${file}`;
      pdfUrl = `${baseUrl}${path}`;
  }

  let albumImages = [];
  if (filepaths) { 
     const parts = filepaths.split(','); 
     albumImages = parts.map(p => {
         const pClean = p.split('||')[0]; 
         const baseUrl = context.appUrl.endsWith('/') ? context.appUrl.slice(0, -1) : context.appUrl;
         const path = pClean.startsWith('/') ? pClean : `/${pClean}`;
         return { uri: `${baseUrl}${path}` };
     });
  } else if (file && !pdfUrl) {
      albumImages = [{ uri: source.uri }];
  }

  // Consolidate all images into one array for Grid and Viewer
  let allImages = [];
  if (albumImages.length > 0) {
      allImages = albumImages;
  } else if (file && !pdfUrl) {
      allImages = [{ uri: source.uri }];
  }

  const [viewerIndex, setViewerIndex] = useState(0);

  const handleImagePress = (index = 0) => {
      setViewerIndex(index);
      setIsModalImageVisible(true);
  };

  const handleReadMessage = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      markMessageAsRead(item.id);
      setIsExpanded(true);
  };

  // Entry Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
      Animated.parallel([
          Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
          })
      ]).start();
  }, []);

  return (
    <Animated.View style={{ 
        opacity: fadeAnim, 
        transform: [{ translateY: slideAnim }],
        ...(styleContext?.card ? { ...styleContext.card, marginBottom: 15 } : { marginBottom: 15, backgroundColor: '#fff', padding: 15, borderRadius: 20 }) 
    }}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 2, marginTop: 4 }}>
        <Text style={{
          fontSize: 10,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: 1,
          backgroundColor: '#f5f5f5',
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          {(item.msg_type || 'General Notification').replace(/-/g, ' ')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', paddingTop: 2 }} >
        <Text style={{ fontSize: 16, color: titleColor, fontWeight: 'bold' }}>
          {title}
        </Text>
      </View>

      {/* Content Area */}
      <View style={{ padding: 10 }}>
          {/* If collapsed, show truncated/overlay or just hide details */}
          {!isExpanded ? (
               <View>
                   {/* Preview Content (Optional: limiting height or lines) */}
                   <View style={{ height: 60, overflow: 'hidden' }}>
                       <RenderHtml
                           contentWidth={contentWidth}
                           source={{ html: content }}
                           tagsStyles={{ body: { fontSize: 18, color: '#333', fontWeight: 'bold', lineHeight: 28, textAlign: 'center' } }} 
                       />
                       {/* Fade Overlay for preview effect */}
                       <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, backgroundColor: 'rgba(255,255,255,0.8)' }} />
                   </View>

                   {/* Read Message Button */}
                   <View style={{ alignItems: 'center', marginTop: 15 }}>
                       <TouchableOpacity 
                           onPress={handleReadMessage}
                           style={{ 
                               flexDirection: 'row', 
                               alignItems: 'center', 
                               backgroundColor: 'rgba(133, 98, 255, 0.1)', // Glass/Subtle tint
                               paddingVertical: 10, 
                               paddingHorizontal: 20, 
                               borderRadius: 30,
                               borderWidth: 1,
                               borderColor: 'rgba(133, 98, 255, 0.3)'
                           }}
                       >
                           <Icon name="email-open-outline" size={20} color="#8562ff" style={{ marginRight: 8 }} />
                           <Text style={{ color: '#8562ff', fontWeight: 'bold', fontSize: 16 }}>Read Message</Text>
                       </TouchableOpacity>
                   </View>
               </View>
          ) : (
             <>
                 <RenderHtml
                     contentWidth={contentWidth}
                     source={{ html: content }}
                     tagsStyles={{ body: { fontSize: 18, color: '#333', fontWeight: 'bold', lineHeight: 28, textAlign: 'center' } }} 
                 />
                 
                 {/* Grid Layout Logic - Only show if expanded */}
                 {allImages.length > 0 && !pdfUrl && (
                    <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 8, overflow: 'hidden' }}>
                        {/* Case 1: Single Image */}
                        {allImages.length === 1 && (
                            <TouchableOpacity onPress={() => handleImagePress(0)} style={{ width: '100%' }}>
                                <Image source={allImages[0]} style={{ width: '100%', height: 300, resizeMode: 'cover' }} />
                            </TouchableOpacity>
                        )}

                        {/* Case 2: Two Images */}
                        {allImages.length === 2 && allImages.map((img, index) => (
                             <TouchableOpacity key={index} onPress={() => handleImagePress(index)} style={{ width: '49%', marginRight: index === 0 ? '2%' : 0 }}>
                                 <Image source={img} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
                             </TouchableOpacity>
                        ))}

                        {/* Case 3: Three Images */}
                        {allImages.length === 3 && (
                            <View style={{ width: '100%' }}>
                                <TouchableOpacity onPress={() => handleImagePress(0)} style={{ width: '100%', marginBottom: 2 }}>
                                    <Image source={allImages[0]} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {allImages.slice(1).map((img, index) => (
                                        <TouchableOpacity key={index + 1} onPress={() => handleImagePress(index + 1)} style={{ width: '49.5%' }}>
                                            <Image source={img} style={{ width: '100%', height: 150, resizeMode: 'cover' }} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Case 4+: Grid */}
                        {allImages.length >= 4 && (
                            <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {allImages.slice(0, 4).map((img, index) => (
                                    <TouchableOpacity key={index} onPress={() => handleImagePress(index)} style={{ width: '49.5%', marginBottom: 2 }}>
                                        <View>
                                            <Image source={img} style={{ width: '100%', height: 150, resizeMode: 'cover' }} />
                                            {/* Overlay for 4th image if more than 4 */}
                                            {index === 3 && allImages.length > 4 && (
                                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>+{allImages.length - 4}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                 )}
             </>
          )}
      </View>

      {/* PDF - Only show if expanded */}
      {isExpanded && showImages && pdfUrl ? <ViewPdf contentUrl={pdfUrl} styles={{ textTextStyle: { color: titleColor } }} /> : null}

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }} >
        <Text style={{ fontSize: 12, color: '#555' }}>
          {msgSentDate ?? dat} {by}
        </Text>
      </View>
      
      {deliveryReportStudent(tim)}
  
      { (role === 'admin' || role === 'super' || role === 'tech' || role === 'principal' || owner === item.owner) ?
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          {renderReSendButton(approvalStatus, item.msg_type)}
          {renderDeliveryReport(tim)}
          {renderDelButton(approvalStatus, item.msg_type)}
      </View>
      : 
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
          {renderDeliveryReport(tim)}
      </View>
      }

      <ImageView
        images={allImages}
        imageIndex={viewerIndex}
        visible={isModalImageVisible}
        onRequestClose={() => setIsModalImageVisible(false)}
        HeaderComponent={({ imageIndex }) => (
          <View style={{
            position: 'absolute',
            top: 0,
            width: '100%',
            zIndex: 9999,
            paddingTop: Platform.OS === 'android' ? 40 : 50, // Manual safe area
            paddingHorizontal: 20,
            alignItems: 'flex-end'
          }}>
            <TouchableOpacity
              onPress={() => setIsModalImageVisible(false)}
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 20,
                padding: 8,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </Animated.View>
  );
};

const styles = {
  previewLoader: {
    height: 50,
    width: 50
  }
};

export default SqlMessageItem;
