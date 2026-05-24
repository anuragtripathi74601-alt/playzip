import 'package:flutter/material.dart';
import '../../services/game_service.dart';
import '../../theme/app_theme.dart';
import '../../app.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _phoneController = TextEditingController(text: '9876543210');
  final _otpController = TextEditingController();
  bool _showOtp = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) return;
    setState(() => _isLoading = true);
    await PlayZipApp.gameService.sendOtp(phone);
    setState(() {
      _isLoading = false;
      _showOtp = true;
    });
  }

  Future<void> _verifyOtp() async {
    setState(() => _isLoading = true);
    final success = await PlayZipApp.gameService.verifyOtp(_otpController.text.trim());
    setState(() => _isLoading = false);
    if (success && mounted) {
      Navigator.pushReplacementNamed(context, '/home');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid OTP'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.primaryColor, AppTheme.darkSurface, AppTheme.darkSurface],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 60),
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 15, offset: const Offset(0, 6))],
                  ),
                  child: const Center(child: Text('🎮', style: TextStyle(fontSize: 40))),
                ),
                const SizedBox(height: 20),
                const Text('Welcome to PlayZip', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Login with your mobile number', style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.6))),
                const SizedBox(height: 40),

                if (!_showOtp) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white, fontSize: 18),
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        prefixText: '+91 ',
                        prefixStyle: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 18),
                        hintText: 'Mobile Number',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity, height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _sendOtp,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                      ),
                      child: _isLoading
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Send OTP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: TextField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white, fontSize: 24, letterSpacing: 8),
                      textAlign: TextAlign.center,
                      maxLength: 6,
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        counterText: '',
                        hintText: '------',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 18),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Demo: Use 123456', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity, height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _verifyOtp,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                      ),
                      child: _isLoading
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Verify & Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => setState(() => _showOtp = false),
                    child: Text('Change Number', style: TextStyle(color: Colors.white.withOpacity(0.6))),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
