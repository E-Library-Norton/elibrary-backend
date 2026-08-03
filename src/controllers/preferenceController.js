const PreferenceService = require('../services/preferenceService');
const ResponseFormatter = require('../utils/responseFormatter');

class PreferenceController {
  static async get(req, res, next) {
    try {
      const preference = await PreferenceService.get(req.user.id);
      return ResponseFormatter.success(
        res,
        preference,
        'Reading preferences retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async save(req, res, next) {
    try {
      const preference = await PreferenceService.save(req.user.id, req.body);
      return ResponseFormatter.success(
        res,
        preference,
        'Reading preferences saved successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const preference = await PreferenceService.save(req.user.id, req.body);
      return ResponseFormatter.success(
        res,
        preference,
        'Reading preferences updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async recommendations(req, res, next) {
    try {
      const recommendations = await PreferenceService.recommendations(
        req.user.id,
        req.query
      );
      return ResponseFormatter.success(
        res,
        recommendations,
        'Recommended books retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PreferenceController;
