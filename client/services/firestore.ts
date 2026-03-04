import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    setDoc,
    query,
    onSnapshot,
    DocumentData,
    QueryConstraint
} from "firebase/firestore";
import { db } from "./firebase";

// Generic function to subscribe to a collection
export const subscribeToCollection = (
    collectionName: string,
    callback: (data: any[]) => void,
    constraints: QueryConstraint[] = []
) => {
    const q = query(collection(db, collectionName), ...constraints);
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(data);
    });
};

// Add a document (auto-generated ID)
export const addDocument = async (collectionName: string, data: any) => {
    const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString()
    });
    return docRef.id;
};

// Update a document
export const updateDocument = async (collectionName: string, id: string, data: any) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
    });
};

// Delete a document
export const deleteDocument = async (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
};

// Set (create or overwrite) a document with a specific ID
export const setDocument = async (collectionName: string, id: string, data: any) => {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
    }, { merge: true });
};

// Get a single document
export const getDocument = async (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
};

// Get all documents once
export const getCollectionDocs = async (collectionName: string, constraints: QueryConstraint[] = []) => {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};
