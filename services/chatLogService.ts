import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const saveChatLog = async (
    uid: string, 
    mode: string, 
    messages: any[], 
    config: any, 
    hasStarted: boolean,
    realData: any[],
    insights: any,
    plotImageBase64: string,
    fullReport: string
) => {
    if (!uid || !mode || !db) return;
    try {
        const docRef = doc(db, 'users', uid, 'chat_logs', mode);
        
        const safeConfig = { ...config };
        if (safeConfig.startDate instanceof Date) safeConfig.startDate = safeConfig.startDate.toISOString();
        if (safeConfig.endDate instanceof Date) safeConfig.endDate = safeConfig.endDate.toISOString();
        
        await setDoc(docRef, {
            messages,
            config: safeConfig,
            hasStarted,
            realData: realData || [],
            insights: insights || null,
            plotImageBase64: plotImageBase64 || '',
            fullReport: fullReport || '',
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving chat log to Firestore:", error);
    }
};

export const loadChatLog = async (uid: string, mode: string) => {
    if (!uid || !mode || !db) return null;
    try {
        const docRef = doc(db, 'users', uid, 'chat_logs', mode);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (error) {
        console.error("Error loading chat log from Firestore:", error);
    }
    return null;
};
