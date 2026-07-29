import { supabase } from '../lib/supabase';

export const uploadImage = async (file: File, sireId: string, bucket = 'sire-images') => {
  try {
    const fileExt = file.name.split('.').pop();
    // Add timestamp to filename to bust cache when re-uploading
    const timestamp = Date.now();
    const filePath = `${sireId}_${timestamp}.${fileExt}`;

    // First, delete any existing images for this sire
    await deleteImage(sireId, bucket);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '31536000'
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { url: null, error: error as Error };
  }
};

export const deleteImage = async (sireId: string, bucket = 'sire-images') => {
  try {
    // List all files for this sire (handles different extensions)
    const { data: files } = await supabase.storage
      .from(bucket)
      .list('', {
        search: sireId
      });

    if (files && files.length > 0) {
      const filePaths = files.map(f => f.name);
      const { error } = await supabase.storage
        .from(bucket)
        .remove(filePaths);

      if (error) throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error as Error };
  }
};
