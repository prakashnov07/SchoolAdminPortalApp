import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import ImagePicker from 'react-native-image-crop-picker';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const AddOnlineQuestionPaperScreen = ({ navigation, route }) => {
    // Expecting 'qp' (legacy prop) or route params that match legacy expectations
    // Legacy: props.qp (the exam object)
    // New: route.params.qp or route.params.examData
    
    const { qp, questionData } = route.params || {}; 
    const isEdit = !!questionData;
    
    const { branchid, phone, appUrl } = useContext(CoreContext);
    const { primary, background, textColor } = useContext(StyleContext);

    const [submitting, setSubmitting] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [message, setMessage] = useState('');

    // Form State
    // Legacy: id, qpid (qp.id), question, qimage ({name, value...}), ... marks, answers
    const [qpid, setQpid] = useState(qp?.id || '');
    const [question, setQuestion] = useState(questionData?.question || '');
    const [qImage, setQImage] = useState(questionData?.qimage || null); // URL string
    const [marks, setMarks] = useState(questionData?.marks?.toString() || '');
    const [isSubjective, setIsSubjective] = useState(questionData?.etype === 'subjective' || false);
    
    // Options
    const [option1, setOption1] = useState(questionData?.option1 || '');
    const [oImage1, setOImage1] = useState(questionData?.oimage1 || null);
    const [option2, setOption2] = useState(questionData?.option2 || '');
    const [oImage2, setOImage2] = useState(questionData?.oimage2 || null);
    const [option3, setOption3] = useState(questionData?.option3 || '');
    const [oImage3, setOImage3] = useState(questionData?.oimage3 || null);
    const [option4, setOption4] = useState(questionData?.option4 || '');
    const [oImage4, setOImage4] = useState(questionData?.oimage4 || null);
    const [option5, setOption5] = useState(questionData?.option5 || '');
    const [oImage5, setOImage5] = useState(questionData?.oimage5 || null);

    // Answers
    const [answers, setAnswers] = useState(
        questionData?.answers ? (Array.isArray(questionData.answers) ? questionData.answers : questionData.answers.split(',')) : []
    );

    const toggleAnswer = (val) => {
        if (answers.includes(val)) {
            setAnswers(answers.filter(a => a !== val));
        } else {
            setAnswers([...answers, val].sort());
        }
    };

    const getImageUri = (imagePath) => {
        if (!imagePath) return null;
        const path = imagePath.split('||')[0];
        if (path.startsWith('http') || path.startsWith('file:')) {
            return { uri: path };
        }
        return { uri: `${appUrl}/${path}` };
    };

    const getAspectRatio = (imagePath) => {
        if (!imagePath) return {};
        const parts = imagePath.split('||');
        if (parts.length >= 3) {
            return { aspectRatio: parts[1] / parts[2] };
        }
        return {};
    };

    const pickImage = async (setImageUrlState) => {
        try {
            const image = await ImagePicker.openPicker({
                mediaType: 'photo',
                cropping: true,
                freeStyleCropEnabled: true,
                includeBase64: true,
                compressImageMaxWidth: 800,
                compressImageMaxHeight: 1200,
            });

            if (image) {
                uploadImage(image.data, setImageUrlState, image.width, image.height);
            }
        } catch (error) {
            console.log('ImagePicker Error: ', error);
            if (error.code !== 'E_PICKER_CANCELLED') {
                Toast.show({ type: 'error', text1: 'Error picking image' });
            }
        }
    };

    const uploadImage = async (base64Data, setImageUrlState, width, height) => {
        setLoadingImage(true);
        setMessage('Uploading image...');
        try {
            const response = await axios.post('/upload-qp-image', {
                filepath: base64Data,
                owner: phone,
                branchid
            });
            
            if (response.data.sFPath) {
                const legacyUrl = `${response.data.sFPath}||${width}||${height}`;
                setImageUrlState(legacyUrl);
                Toast.show({ type: 'success', text1: 'Image uploaded' });
                setMessage('');
            } else {
                Toast.show({ type: 'error', text1: 'Upload failed' });
                setMessage('Image upload failed');
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Image upload failed' });
            setMessage('Error uploading image');
        } finally {
            setLoadingImage(false);
        }
    };

    const handleSave = async () => {
        if (isSubjective) {
            if (!question && !qImage) return Toast.show({ type: 'error', text1: 'Enter Question or Upload Image' });
            if (!marks) return Toast.show({ type: 'error', text1: 'Enter Marks' });
        } else {
            if (!question && !qImage) return Toast.show({ type: 'error', text1: 'Enter Question or Upload Image' });
            if (!marks) return Toast.show({ type: 'error', text1: 'Enter Marks' });
            if (!option1 && !oImage1) return Toast.show({ type: 'error', text1: 'Enter Option A' });
            if (!option2 && !oImage2) return Toast.show({ type: 'error', text1: 'Enter Option B' });
            if (!option3 && !oImage3) return Toast.show({ type: 'error', text1: 'Enter Option C' });
            if (!option4 && !oImage4) return Toast.show({ type: 'error', text1: 'Enter Option D' });
            if (answers.length === 0) return Toast.show({ type: 'error', text1: 'Select Correct Answers' });
        }

        setSubmitting(true);
        setMessage('Uploading Question paper....');
        try {
            const payload = {
                id: isEdit ? questionData.id : undefined,
                qpid: qp?.id || qpid,
                etype: isSubjective ? 'subjective' : 'objective',
                question, 
                qimage: qImage || '', 
                marks,
                owner: phone,
                branchid,
                option1, oimage1: oImage1 || '',
                option2, oimage2: oImage2 || '',
                option3, oimage3: oImage3 || '',
                option4, oimage4: oImage4 || '',
                option5, oimage5: oImage5 || '',
                answers: answers // Legacy expects array usually, or logic handles it
            };

            await axios.post('/upload-qp', payload);
            Toast.show({ type: 'success', text1: 'Successfully Uploaded' });
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error uploading question' });
            setMessage('Error ...');
        } finally {
            setSubmitting(false);
            setMessage('');
        }
    };

    const renderOptionInput = (label, value, setValue, image, setImage, answerVal) => (
        <View style={styles.optionContainer}>
           <View style={styles.optionHeader}>
               <Text style={styles.optionLabel}>{label}</Text>
               {!isSubjective && (
                   <TouchableOpacity 
                       style={[styles.checkbox, answers.includes(answerVal) && { backgroundColor: 'green', borderColor: 'green' }]}
                       onPress={() => toggleAnswer(answerVal)}
                   >
                        {answers.includes(answerVal) && <Icon name="check" size={16} color="#fff" />}
                   </TouchableOpacity>
               )}
           </View>
           <TextInput
               style={styles.input}
               value={value}
               onChangeText={setValue}
               placeholder={`Enter ${label}`}
               multiline
               numberOfLines={3}
               textAlignVertical="top"
           />
           <View style={styles.imageRow}>
                {image ? (
                   <View style={styles.previewContainer}>
                       <Image source={getImageUri(image)} style={[styles.previewImage, getAspectRatio(image)]} resizeMode="contain" />
                       <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImgBtn}>
                           <Icon name="close" size={16} color="#fff" />
                       </TouchableOpacity>
                   </View>
                ) : (
                   <TouchableOpacity onPress={() => pickImage(setImage)} style={styles.uploadBtn}>
                       <Icon name="camera" size={20} color="#666" />
                       <Text style={styles.uploadText}>Upload Image</Text>
                   </TouchableOpacity>
                )}
           </View>
       </View>
   );

    return (
        <ScrollView style={[styles.container, { backgroundColor: background?.backgroundColor || '#fff' }]}>
            <View style={styles.content}>
                
                <View style={styles.header}>
                     <Text style={styles.headerText}>
                        {qp?.date} (Class: {qp?.cls} Subject: {qp?.subject})
                     </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Question</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={question}
                        onChangeText={setQuestion}
                        multiline
                        placeholder="Enter Question"
                        textAlignVertical="top"
                    />
                    <View style={styles.imageRow}>
                        {qImage ? (
                            <View style={styles.previewContainer}>
                                <Image source={getImageUri(qImage)} style={[styles.previewImage, getAspectRatio(qImage)]} resizeMode="contain" />
                                <TouchableOpacity onPress={() => setQImage(null)} style={styles.removeImgBtn}>
                                    <Icon name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => pickImage(setQImage)} style={styles.uploadBtn}>
                                <Icon name="camera" size={20} color="#666" />
                                <Text style={styles.uploadText}>Upload Question Image</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Subjective Type</Text>
                        <Switch value={isSubjective} onValueChange={setIsSubjective} />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Enter Marks</Text>
                    <TextInput
                        style={styles.input}
                        value={marks}
                        onChangeText={setMarks}
                        keyboardType="numeric"
                        placeholder="Marks"
                        maxLength={3}
                    />
                </View>

                {!isSubjective && (
                    <View style={styles.optionsSection}>
                        <Text style={styles.sectionTitle}>Correct Answers</Text>
                        <View style={styles.checkboxRow}>
                            {['A', 'B', 'C', 'D', 'E'].map(opt => (
                                <View key={opt} style={styles.checkItem}>
                                    <Text style={{marginBottom: 5}}>{opt}</Text>
                                    <TouchableOpacity 
                                        style={[styles.checkbox, answers.includes(opt) && { backgroundColor: 'green', borderColor: 'green' }]}
                                        onPress={() => toggleAnswer(opt)}
                                    >
                                        {answers.includes(opt) && <Icon name="check" size={16} color="#fff" />}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {renderOptionInput('Option A', option1, setOption1, oImage1, setOImage1, 'A')}
                        {renderOptionInput('Option B', option2, setOption2, oImage2, setOImage2, 'B')}
                        {renderOptionInput('Option C', option3, setOption3, oImage3, setOImage3, 'C')}
                        {renderOptionInput('Option D', option4, setOption4, oImage4, setOImage4, 'D')}
                        {renderOptionInput('Option E', option5, setOption5, oImage5, setOImage5, 'E')}
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: primary?.backgroundColor || '#6200ee' }]} 
                    onPress={handleSave}
                    disabled={submitting || loadingImage}
                >
                    {(submitting || loadingImage) ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Update</Text>
                    )}
                </TouchableOpacity>

                {message ? <Text style={styles.messageText}>{message}</Text> : null}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 15,
        paddingBottom: 50,
    },
    header: {
        marginBottom: 15,
        backgroundColor: '#e3f2fd',
        padding: 10,
        borderRadius: 5,
    },
    headerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1565c0',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fafafa',
        fontSize: 16,
        marginBottom: 10,
    },
    textArea: {
        height: 100,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    uploadText: {
        marginLeft: 8,
        color: '#555',
    },
    previewContainer: {
        alignItems: 'center',
        position: 'relative',
        marginTop: 5,
    },
    previewImage: {
        width: 200,
        height: 150,
        borderRadius: 5,
        backgroundColor: '#eee',
    },
    removeImgBtn: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'red',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    checkboxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
    },
    checkItem: {
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#aaa',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderBottomWidth: 5,
        borderBottomColor: '#f0f0f0',
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionLabel: {
        fontWeight: 'bold',
        color: '#555',
    },
    saveBtn: {
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 20,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    messageText: {
        textAlign: 'center',
        color: '#d32f2f',
        marginTop: 10,
        fontWeight: 'bold',
    },
});

export default AddOnlineQuestionPaperScreen;
