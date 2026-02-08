import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import ImagePicker from 'react-native-image-crop-picker';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
// CheckBox removed as it's not in package.json

const AddOnlineExamQuestionScreen = ({ navigation, route }) => {
    const { examId, examData, questionData } = route.params;
    const { branchid, phone, appUrl } = useContext(CoreContext);
    const { primary, background, textColor } = useContext(StyleContext);

    const isEdit = !!questionData;
    const [submitting, setSubmitting] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);

    // Form State
    const [question, setQuestion] = useState(questionData?.question || questionData?.qp || '');
    const [qImage, setQImage] = useState(questionData?.qimage || questionData?.qimg || null); // URL
    const [marks, setMarks] = useState(questionData?.marks?.toString() || '1');
    const [isSubjective, setIsSubjective] = useState(questionData?.etype === 'Subjective' || false);
    
    // Options
    const [option1, setOption1] = useState(questionData?.option1 || '');
    const [oImage1, setOImage1] = useState(questionData?.oimage1 || questionData?.oimg1 || null);
    const [option2, setOption2] = useState(questionData?.option2 || '');
    const [oImage2, setOImage2] = useState(questionData?.oimage2 || questionData?.oimg2 || null);
    const [option3, setOption3] = useState(questionData?.option3 || '');
    const [oImage3, setOImage3] = useState(questionData?.oimage3 || questionData?.oimg3 || null);
    const [option4, setOption4] = useState(questionData?.option4 || '');
    const [oImage4, setOImage4] = useState(questionData?.oimage4 || questionData?.oimg4 || null);
    const [option5, setOption5] = useState(questionData?.option5 || '');
    const [oImage5, setOImage5] = useState(questionData?.oimage5 || questionData?.oimg5 || null);

    // Answers (Array of 'A', 'B', 'C', 'D', 'E')
    // Legacy mapping: item.answers (array) or item.correct (string)
    const [answers, setAnswers] = useState(
        questionData?.answers || 
        (questionData?.correct ? questionData.correct.split('') : [])
    );

    const toggleAnswer = (val) => {
        if (answers.includes(val)) {
            setAnswers(answers.filter(a => a !== val));
        } else {
            setAnswers([...answers, val]);
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
                // Show local preview immediately? 
                // Currently we upload and THEN show. 
                // To keep it simple and consistent with "uploading" state, we wait.
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
        try {
            const response = await axios.post('/upload-qp-image', {
                filepath: base64Data,
                owner: phone,
                branchid
            });
            
            console.log('Upload Response:', response.data);
            if (response.data.sFPath) {
                // Legacy format: path||width||height
                const legacyUrl = `${response.data.sFPath}||${width}||${height}`;
                setImageUrlState(legacyUrl);
                Toast.show({ type: 'success', text1: 'Image uploaded' });
            } else {
                 Toast.show({ type: 'error', text1: 'Upload failed, no path returned' });
            }

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Image upload failed' });
        } finally {
            setLoadingImage(false);
        }
    };

    useEffect(() => {
        // Cleanup or initial logic if needed
    }, []);

    const handleSave = async () => {
        // ... (validation checks)
        if (!question && !qImage) {
            Toast.show({ type: 'error', text1: 'Please enter a question or upload an image' });
            return;
        }

        if (!isSubjective && answers.length === 0) {
             Toast.show({ type: 'error', text1: 'Please select at least one correct answer' });
             return;
        }

        setSubmitting(true);
        try {
            const payload = {
                id: isEdit ? questionData.id : undefined,
                qpid: examId,
                etype: isSubjective ? 'subjective' : 'objective',
                question, qp: question,
                qimage: qImage || '', qimg: qImage || '',
                marks,
                owner: phone,
                branchid,
                // Options
                option1, oimage1: oImage1 || '', oimg1: oImage1 || '',
                option2, oimage2: oImage2 || '', oimg2: oImage2 || '',
                option3, oimage3: oImage3 || '', oimg3: oImage3 || '',
                option4, oimage4: oImage4 || '', oimg4: oImage4 || '',
                option5, oimage5: oImage5 || '', oimg5: oImage5 || '',
                // Answers: Legacy expects array
                answers: answers 
            };

            await axios.post('/upload-qp', payload);
            Toast.show({ type: 'success', text1: isEdit ? 'Question updated' : 'Question added' });
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to save question' });
        } finally {
            setSubmitting(false);
        }
    };

    const renderOptionInput = (label, value, setValue, image, setImage, answerVal) => (
         <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
                <Text style={styles.optionLabel}>{label}</Text>
                {!isSubjective && (
                    <TouchableOpacity 
                        style={[styles.checkbox, answers.includes(answerVal) && { backgroundColor: 'green' }]}
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
                placeholder={`Enter ${label} text`}
                multiline
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
        <ScrollView style={[styles.container, { backgroundColor: background?.backgroundColor }]}>
            <View style={styles.content}>
                
                <View style={styles.row}>
                    <Text style={styles.label}>Subjective?</Text>
                    <Switch value={isSubjective} onValueChange={setIsSubjective} />
                </View>

                <Text style={styles.label}>Question</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                    placeholder="Enter question here..."
                />

                <View style={styles.section}>
                    <Text style={styles.subLabel}>Question Image</Text>
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

                <Text style={styles.label}>Marks</Text>
                <TextInput
                    style={styles.input}
                    value={marks}
                    onChangeText={setMarks}
                    keyboardType="numeric"
                />

                {!isSubjective && (
                    <View style={styles.optionsSection}>
                        <Text style={styles.sectionTitle}>Options (Select correct answers)</Text>
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
                        <Text style={styles.saveBtnText}>Save Question</Text>
                    )}
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
        color: '#444',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    section: {
        marginVertical: 10,
    },
    subLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        padding: 10,
        borderRadius: 8,
        justifyContent: 'center',
    },
    uploadText: {
        marginLeft: 8,
        color: '#444',
    },
    previewContainer: {
        position: 'relative',
        alignItems: 'center',
        marginVertical: 5,
    },
    previewImage: {
        width: 200,
        height: 150,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
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
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    optionContainer: {
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    optionLabel: {
        fontWeight: 'bold',
        color: '#555',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#777',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageRow: {
        marginTop: 10,
    },
    saveBtn: {
        marginTop: 30,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 50,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddOnlineExamQuestionScreen;
