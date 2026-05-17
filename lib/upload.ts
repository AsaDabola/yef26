import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseAuth } from './auth';
import { storage } from './firebase';

export async function uploadFile(uri: string, filename = 'upload') {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const name = `${Date.now()}_${filename}`;
  const storageRef = ref(storage, `uploads/${user.uid}/${name}`);
  const resp = await fetch(uri);
  const blob = await resp.blob();
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
