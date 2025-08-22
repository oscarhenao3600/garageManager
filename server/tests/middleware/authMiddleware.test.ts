import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, isAdmin } from '../../middleware/authMiddleware';

// Mock de JWT
const mockJWTSecret = 'test-secret';
const mockToken = jwt.sign(
  { id: 1, username: 'testuser', role: 'admin' },
  mockJWTSecret
);

// Mock de Request, Response y NextFunction
const mockRequest = (headers: any = {}) => ({
  headers,
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = mockJWTSecret;
  });

  describe('authenticateToken', () => {
    it('should call next() when valid token is provided', () => {
      const req = mockRequest({
        authorization: `Bearer ${mockToken}`
      });
      const res = mockResponse();

      authenticateToken(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((req as any).user).toBeDefined();
      expect((req as any).user.id).toBe(1);
      expect((req as any).user.username).toBe('testuser');
      expect((req as any).user.role).toBe('admin');
    });

    it('should return 401 when no token is provided', () => {
      const req = mockRequest();
      const res = mockResponse();

      authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when invalid token is provided', () => {
      const req = mockRequest({
        authorization: 'Bearer invalid-token'
      });
      const res = mockResponse();

      authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      const req = mockRequest({
        authorization: 'InvalidFormat token'
      });
      const res = mockResponse();

      authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should call next() when user is admin', () => {
      const req = mockRequest();
      (req as any).user = { role: 'admin' };
      const res = mockResponse();

      isAdmin(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() when user is superAdmin', () => {
      const req = mockRequest();
      (req as any).user = { role: 'superAdmin' };
      const res = mockResponse();

      isAdmin(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      const req = mockRequest();
      (req as any).user = { role: 'operator' };
      const res = mockResponse();

      isAdmin(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Admin privileges required.' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is undefined', () => {
      const req = mockRequest();
      (req as any).user = {};
      const res = mockResponse();

      isAdmin(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Admin privileges required.' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
