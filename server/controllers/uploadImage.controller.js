import uploadImageCloudinary from "../utils/uploadImageCloudinary.js";

const uploadImageController = async (req,res)=>{
   const file = req.file;
   if(!file){
       return res.status(400).json({
           success: false,
           error: true,
           message: "No file uploaded"
       });
   }

   try {
       const uploadImage = await uploadImageCloudinary(file);
       res.status(200).json({
           message : "Image uploaded successfully",
           success: true,
           error: false,
           data: uploadImage
       });

   } catch (error) {
       res.status(500).json({
           success: false,
           error: true,
           message: error.message || error
       });
   }
}

export default uploadImageController;