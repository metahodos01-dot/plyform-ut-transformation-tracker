import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface FeedbackData {
    contractId: string;
    clauseText: string;
    originalRisk: string;
    userCorrection: string;
    userId: string;
    timestamp: any;
}

export async function saveFeedback(data: Omit<FeedbackData, 'timestamp'>) {
    if (!db) throw new Error("Firestore not initialized");

    try {
        const docRef = await addDoc(collection(db, "training_data"), {
            ...data,
            timestamp: serverTimestamp()
        });
        console.log("Feedback saved with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding feedback: ", e);
        throw e;
    }
}
