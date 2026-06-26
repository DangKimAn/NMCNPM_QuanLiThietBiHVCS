import { useState } from 'react';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiShield } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/env';

// -------- Bước 1: Nhập email --------
interface Step1Props {
  onSuccess: (email: string) => void;
}
const Step1Email = ({ onSuccess }: Step1Props) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      onSuccess(email);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-step-content">
      <div className="fp-step-icon fp-icon-blue">
        <FiMail size={28} />
      </div>
      <h2 className="fp-step-title">Quên mật khẩu?</h2>
      <p className="fp-step-desc">
        Nhập địa chỉ email học viện của bạn. Chúng tôi sẽ gửi mã OTP 6 số để xác minh.
      </p>

      {error && (
        <div className="fp-alert fp-alert-error">
          <FiAlertCircle className="fp-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="fp-form">
        <div className="fp-input-wrap">
          <label className="fp-label">Địa chỉ Email</label>
          <div className="fp-input-group">
            <FiMail className="fp-input-icon" />
            <input
              type="email"
              className="fp-input"
              placeholder="user@student.ptithcm.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>
        </div>
        <button type="submit" className="fp-btn-primary" disabled={loading}>
          {loading ? <span className="fp-spinner" /> : null}
          {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
        </button>
      </form>

      <Link to="/login" className="fp-back-link">
        <FiArrowLeft size={14} />
        Quay lại đăng nhập
      </Link>
    </div>
  );
};

// -------- Bước 2: Nhập OTP --------
interface Step2Props {
  email: string;
  onSuccess: (otp: string) => void;
  onBack: () => void;
}
const Step2Otp = ({ email, onSuccess, onBack }: Step2Props) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const otpValue = otp.join('');

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      (nextInput as HTMLInputElement)?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${idx - 1}`);
      (prev as HTMLInputElement)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      e.preventDefault();
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, otp: otpValue });
      onSuccess(otpValue);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-step-content">
      <div className="fp-step-icon fp-icon-indigo">
        <FiShield size={28} />
      </div>
      <h2 className="fp-step-title">Nhập mã OTP</h2>
      <p className="fp-step-desc">
        Mã OTP 6 số đã được gửi đến <strong>{email}</strong>. Mã có hiệu lực trong 15 phút.
      </p>

      {error && (
        <div className="fp-alert fp-alert-error">
          <FiAlertCircle className="fp-alert-icon" />
          <span>{error}</span>
        </div>
      )}
      {resent && (
        <div className="fp-alert fp-alert-success">
          <FiCheckCircle className="fp-alert-icon" />
          <span>Đã gửi lại mã OTP!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="fp-form">
        <div className="fp-otp-row" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={`fp-otp-cell ${digit ? 'fp-otp-filled' : ''}`}
              disabled={loading}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          type="submit"
          className="fp-btn-primary"
          disabled={loading || otpValue.length !== 6}
        >
          {loading ? <span className="fp-spinner" /> : null}
          {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
        </button>
      </form>

      <div className="fp-footer-row">
        <button onClick={onBack} className="fp-back-link" type="button">
          <FiArrowLeft size={14} />
          Thay đổi email
        </button>
        <button onClick={handleResend} className="fp-resend-link" disabled={resending} type="button">
          {resending ? 'Đang gửi lại...' : 'Gửi lại mã'}
        </button>
      </div>
    </div>
  );
};

// -------- Bước 3: Đặt mật khẩu mới --------
interface Step3Props {
  email: string;
  otp: string;
}
const Step3Reset = ({ email, otp }: Step3Props) => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });
      sessionStorage.removeItem('verified_otp');
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fp-step-content fp-success-state">
        <div className="fp-step-icon fp-icon-green">
          <FiCheckCircle size={32} />
        </div>
        <h2 className="fp-step-title">Thành công!</h2>
        <p className="fp-step-desc">
          Mật khẩu của bạn đã được đặt lại. Đang chuyển hướng về trang đăng nhập...
        </p>
        <div className="fp-success-bar" />
      </div>
    );
  }

  return (
    <div className="fp-step-content">
      <div className="fp-step-icon fp-icon-green">
        <FiLock size={28} />
      </div>
      <h2 className="fp-step-title">Đặt mật khẩu mới</h2>
      <p className="fp-step-desc">Tạo mật khẩu mới cho tài khoản của bạn.</p>

      {error && (
        <div className="fp-alert fp-alert-error">
          <FiAlertCircle className="fp-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="fp-form">
        <div className="fp-input-wrap">
          <label className="fp-label">Mật khẩu mới</label>
          <div className="fp-input-group">
            <FiLock className="fp-input-icon" />
            <input
              type="password"
              className="fp-input"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              autoFocus
            />
          </div>
        </div>
        <div className="fp-input-wrap">
          <label className="fp-label">Xác nhận mật khẩu</label>
          <div className="fp-input-group">
            <FiLock className="fp-input-icon" />
            <input
              type="password"
              className="fp-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>
        <button type="submit" className="fp-btn-primary" disabled={loading}>
          {loading ? <span className="fp-spinner" /> : null}
          {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  );
};

// -------- Component chính --------
export const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');

  const goStep2 = (resolvedEmail: string) => {
    setEmail(resolvedEmail);
    setStep(2);
  };

  const goStep3 = (otp: string) => {
    setVerifiedOtp(otp);
    setStep(3);
  };

  return (
    <div className="fp-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        .fp-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #f5f3ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
        }
        .fp-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
          width: 100%;
          max-width: 440px;
          overflow: hidden;
        }
        .fp-progress {
          height: 4px;
          background: #e2e8f0;
          position: relative;
        }
        .fp-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border-radius: 4px;
          transition: width 0.5s cubic-bezier(.4,0,.2,1);
        }
        .fp-steps-indicator {
          display: flex;
          justify-content: space-between;
          padding: 16px 24px 0;
        }
        .fp-step-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }
        .fp-step-dot.active { color: #3b82f6; }
        .fp-step-dot.done { color: #22c55e; }
        .fp-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #e2e8f0;
        }
        .fp-step-dot.active .fp-dot { background: #3b82f6; }
        .fp-step-dot.done .fp-dot { background: #22c55e; }
        .fp-step-content {
          padding: 28px 32px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .fp-step-icon {
          width: 64px; height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .fp-icon-blue { background: #eff6ff; color: #3b82f6; }
        .fp-icon-indigo { background: #eef2ff; color: #6366f1; }
        .fp-icon-green { background: #f0fdf4; color: #22c55e; }
        .fp-step-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px;
        }
        .fp-step-desc {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 24px;
        }
        .fp-step-desc strong { color: #1e293b; }
        .fp-alert {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
          text-align: left;
        }
        .fp-alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .fp-alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .fp-alert-icon { flex-shrink: 0; width: 18px; height: 18px; }
        .fp-form { width: 100%; display: flex; flex-direction: column; gap: 16px; }
        .fp-input-wrap { display: flex; flex-direction: column; gap: 6px; text-align: left; }
        .fp-label { font-size: 13px; font-weight: 600; color: #374151; }
        .fp-input-group { position: relative; }
        .fp-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          width: 16px; height: 16px;
        }
        .fp-input {
          width: 100%;
          padding: 11px 14px 11px 38px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          background: #f8fafc;
          color: #1e293b;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .fp-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px #bfdbfe55; background: white; }
        .fp-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .fp-otp-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 8px 0 4px;
        }
        .fp-otp-cell {
          width: 52px; height: 60px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          font-family: inherit;
        }
        .fp-otp-cell:focus { border-color: #6366f1; box-shadow: 0 0 0 3px #a5b4fc44; background: white; }
        .fp-otp-cell.fp-otp-filled { border-color: #6366f1; background: #eef2ff; color: #6366f1; }
        .fp-otp-cell:disabled { opacity: 0.6; }
        .fp-btn-primary {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.1s;
          font-family: inherit;
          margin-top: 4px;
        }
        .fp-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .fp-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .fp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .fp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: fp-spin 0.7s linear infinite;
        }
        @keyframes fp-spin { to { transform: rotate(360deg); } }
        .fp-back-link, .fp-resend-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          transition: color 0.2s;
          padding: 0;
        }
        .fp-back-link { color: #64748b; }
        .fp-back-link:hover { color: #1e293b; }
        .fp-resend-link { color: #3b82f6; }
        .fp-resend-link:hover { color: #1d4ed8; }
        .fp-resend-link:disabled { opacity: 0.5; cursor: not-allowed; }
        .fp-footer-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-top: 8px;
        }
        .fp-success-state { padding-bottom: 36px; }
        .fp-success-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 20px;
        }
        .fp-success-bar::after {
          content: '';
          display: block;
          height: 100%;
          width: 0;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          border-radius: 10px;
          animation: fp-fill 2.3s ease-in-out forwards;
        }
        @keyframes fp-fill { to { width: 100%; } }
        .fp-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 32px 0;
          gap: 0;
        }
        .fp-brand-text {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.5px;
        }
      `}</style>

      <div className="fp-card">
        {/* Brand */}
        <div className="fp-brand">
          <span className="fp-brand-text" style={{ color: '#2563eb' }}>HVCS</span>
          <span className="fp-brand-text" style={{ color: '#1e293b' }}>.Edu</span>
        </div>

        {/* Progress bar */}
        <div className="fp-progress" style={{ margin: '12px 32px 0' }}>
          <div
            className="fp-progress-bar"
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          />
        </div>

        {/* Step indicators */}
        <div className="fp-steps-indicator">
          {[
            { label: 'Email', s: 1 },
            { label: 'OTP', s: 2 },
            { label: 'Mật khẩu', s: 3 },
          ].map(({ label, s }) => (
            <div
              key={s}
              className={`fp-step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`}
            >
              <span className="fp-dot" />
              {label}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && <Step1Email onSuccess={goStep2} />}
        {step === 2 && (
          <Step2Otp
            email={email}
            onSuccess={goStep3}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && <Step3Reset email={email} otp={verifiedOtp} />}
      </div>
    </div>
  );
};
