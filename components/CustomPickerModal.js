import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { StyleContext } from '../context/StyleContext';

export default function CustomPickerModal({ 
    visible, 
    title, 
    data, 
    selectedValue, 
    onSelect, 
    onClose, 
    onConfirm,
    onReload 
}) {
    const styleContext = useContext(StyleContext);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity 
                style={styleContext.pickerModalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={styleContext.pickerModalContent}>
                        <Text style={styleContext.pickerModalTitle}>{title}</Text>
                        
                        {data && data.length > 0 ? (
                            <ScrollView style={{ maxHeight: 300, flexGrow: 0 }}>
                            {data.map((item, idx) => {
                                const label = (item && typeof item === 'object') ? (item.label || '') : item;
                                const value = (item && typeof item === 'object' && item.value !== undefined) ? item.value : item;
                                return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                    styleContext.pickerModalItem,
                                    value === selectedValue && styleContext.pickerModalItemSelected,
                                    ]}
                                    onPress={() => onSelect(value)}
                                >
                                    <Text
                                    style={[
                                        styleContext.pickerModalItemText,
                                        value === selectedValue && styleContext.pickerModalItemTextSelected,
                                    ]}
                                    >
                                    {label}
                                    </Text>
                                </TouchableOpacity>
                                );
                            })}
                            </ScrollView>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#666' }}>No items found.</Text>
                                {onReload && (
                                    <TouchableOpacity onPress={onReload} style={{ marginTop: 10 }}>
                                        <Text style={{ color: styleContext.mainButtonColor, fontWeight: 'bold' }}>Reload Data</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <View style={styleContext.pickerModalButtons}>
                            <TouchableOpacity style={styleContext.pickerModalButton} onPress={onClose}>
                                <Text style={[styleContext.pickerModalButtonText, { color: styleContext.mainButtonColor }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styleContext.pickerModalButton} onPress={onConfirm}>
                                <Text style={[styleContext.pickerModalButtonText, { color: styleContext.mainButtonColor }]}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
}
