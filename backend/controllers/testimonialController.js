const Testimonial = require('../models/Testimonial');


// CREATE TESTIMONIAL
exports.createTestimonial = async (req, res) => {
    try {

        const { name, designation, content, rating } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        const testimonial = new Testimonial({
            name,
            designation,
            content,
            rating,
            imageUrl: req.file.filename
        });

        await testimonial.save();

        res.status(201).json({
            success: true,
            message: 'Testimonial created successfully',
            testimonial
        });

    } catch (error) {

        console.error("Create Testimonial Error:", error);

        res.status(500).json({
            success: false,
            message: 'Failed to create testimonial',
            error: error.message
        });

    }
};



// GET ALL TESTIMONIALS
exports.getAllTestimonials = async (req, res) => {

    try {

        const searchTerm = req.query.search || '';

        let query = {};

        if (searchTerm) {
            query = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { designation: { $regex: searchTerm, $options: 'i' } },
                    { content: { $regex: searchTerm, $options: 'i' } }
                ]
            };
        }

        const testimonials = await Testimonial
            .find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.json(testimonials);

    } catch (error) {

        console.error("Fetch Testimonials Error:", error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch testimonials',
            error: error.message
        });

    }

};



// GET SINGLE TESTIMONIAL
exports.getTestimonialById = async (req, res) => {

    try {

        const testimonial = await Testimonial.findById(req.params.id);

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }

        res.json(testimonial);

    } catch (error) {

        console.error("Get Testimonial Error:", error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch testimonial',
            error: error.message
        });

    }

};



// UPDATE TESTIMONIAL
exports.updateTestimonial = async (req, res) => {

    try {

        const testimonialId = req.params.id;

        const existingTestimonial = await Testimonial.findById(testimonialId);

        if (!existingTestimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }

        const { name, designation, content, rating, isActive } = req.body;

        const updateData = {
            name,
            designation,
            content,
            rating,
            isActive
        };

        if (req.file) {
            updateData.imageUrl = req.file.filename;
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            testimonialId,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Testimonial updated successfully',
            testimonial: updatedTestimonial
        });

    } catch (error) {

        console.error("Update Testimonial Error:", error);

        res.status(500).json({
            success: false,
            message: 'Failed to update testimonial',
            error: error.message
        });

    }

};



// DELETE TESTIMONIAL
exports.deleteTestimonial = async (req, res) => {

    try {

        const testimonialId = req.params.id;

        const testimonial = await Testimonial.findById(testimonialId);

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }

        await Testimonial.findByIdAndDelete(testimonialId);

        res.json({
            success: true,
            message: 'Testimonial deleted successfully'
        });

    } catch (error) {

        console.error("Delete Testimonial Error:", error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete testimonial',
            error: error.message
        });

    }

};