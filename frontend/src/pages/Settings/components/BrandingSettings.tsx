import { useEffect, useState, type FormEvent } from 'react';
import { FiAlertCircle, FiCheck, FiUpload, FiX } from 'react-icons/fi';
import {
  fetchBranding,
  updateBranding,
  uploadLogo,
  type Branding,
  type BrandingError,
} from '../../../api/branding';
import type { Role } from '../../../api/members';

/**
 * Workspace branding.
 *
 * Owners and admins can edit; everyone else sees the values read-only, because
 * knowing what your workspace is called is not privileged. The database
 * refuses the write either way.
 */

const MESSAGES: Record<BrandingError, string> = {
  not_permitted: 'Only owners and admins can change branding.',
  missing_name: 'The workspace needs a name.',
  invalid_logo: 'That logo address is not usable.',
  upload_failed: 'The image could not be uploaded. Please try again.',
  file_too_large: 'That image is larger than 2 MB. Try a smaller file.',
  wrong_file_type: 'Use a PNG, JPG, SVG, or WebP image.',
};

const FIELDS: {
  key: keyof Branding;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: 'name',
    label: 'Workspace name',
    hint: 'Shown in the sidebar, on owner labels, and around the app.',
    placeholder: 'Rocking K Cattle',
  },
  {
    key: 'legalName',
    label: 'Legal name',
    hint: 'Used on reports and copyright lines. Defaults to the workspace name.',
    placeholder: 'Rocking K Cattle Co., LLC',
  },
  {
    key: 'loginHint',
    label: 'Sign-in note',
    hint: 'Optional line under the sign-in form, for anything your crew needs telling.',
    placeholder: 'Use the email your manager set you up with',
  },
  {
    key: 'reportFooter',
    label: 'Report footer',
    hint: 'Trailing line on generated reports. Defaults to the legal name.',
    placeholder: 'Rocking K Cattle Co.',
  },
];

interface BrandingSettingsProps {
  role: Role | null;
}

export default function BrandingSettings({ role }: BrandingSettingsProps) {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const canEdit = role === 'owner' || role === 'admin';

  useEffect(() => {
    fetchBranding()
      .then(setBranding)
      .catch((err) => {
        console.error('Could not read branding:', err);
        setError('Could not load branding.');
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Uploads immediately on choosing a file, then saves the whole form so the
   * new logo is live rather than sitting in an unsaved field.
   */
  const handleLogoChange = async (file: File | undefined) => {
    if (!file || !branding) return;

    setUploading(true);
    setError(null);
    setSaved(false);

    try {
      const upload = await uploadLogo(file);

      if (!upload.ok) {
        setError(MESSAGES[upload.errorCode]);
        return;
      }

      const next = { ...branding, logoUrl: upload.url };
      setBranding(next);

      const result = await updateBranding(next);
      if (!result.ok) {
        setError(result.errorCode ? MESSAGES[result.errorCode] : 'Could not save the logo.');
        return;
      }

      setSaved(true);
    } catch (err) {
      console.error('Logo upload failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!branding) return;

    const next = { ...branding, logoUrl: '' };
    setBranding(next);
    setError(null);

    const result = await updateBranding(next);
    if (!result.ok) {
      setError(result.errorCode ? MESSAGES[result.errorCode] : 'Could not remove the logo.');
      return;
    }

    setSaved(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!branding) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const result = await updateBranding(branding);

      if (!result.ok) {
        setError(result.errorCode ? MESSAGES[result.errorCode] : 'Could not save branding.');
        return;
      }

      setSaved(true);
    } catch (err) {
      console.error('Saving branding failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings__card">
        <div className="settings__item">
          <p className="settings__item-value">Loading branding…</p>
        </div>
      </div>
    );
  }

  if (!branding) return null;

  return (
    <>
      {error && (
        <div className="team__banner team__banner--error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="team__banner team__banner--ok" role="status">
          <FiCheck aria-hidden="true" />
          <span>Branding saved.</span>
        </div>
      )}

      <form className="settings__card branding" onSubmit={handleSubmit}>
        {FIELDS.map(({ key, label, hint, placeholder }) => (
          <label className="branding__field" key={key}>
            <span className="branding__label">{label}</span>
            <input
              type="text"
              value={branding[key]}
              placeholder={placeholder}
              disabled={!canEdit || saving}
              onChange={(event) => setBranding({ ...branding, [key]: event.target.value })}
            />
            <span className="branding__hint">{hint}</span>
          </label>
        ))}

        <div className="branding__field">
          <span className="branding__label">Logo</span>

          <div className="branding__logo">
            {/* Shown exactly as the sign-in screen will show it, so a bad
                crop or a transparent-on-white problem is obvious here. */}
            <img
              className="branding__logo-preview"
              src={branding.logoUrl || '/logo.svg'}
              alt=""
            />

            {canEdit && (
              <div className="branding__logo-actions">
                <label className="branding__upload">
                  <FiUpload aria-hidden="true" />
                  {uploading ? 'Uploading…' : branding.logoUrl ? 'Replace' : 'Upload a logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    disabled={uploading || saving}
                    onChange={(event) => {
                      void handleLogoChange(event.target.files?.[0]);
                      // Cleared so choosing the same file twice still fires.
                      event.target.value = '';
                    }}
                  />
                </label>

                {branding.logoUrl && (
                  <button
                    type="button"
                    className="branding__logo-clear"
                    onClick={handleLogoRemove}
                    disabled={uploading || saving}
                  >
                    <FiX aria-hidden="true" /> Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <span className="branding__hint">
            Shown on the sign-in screen. PNG, JPG, SVG, or WebP, up to 2 MB. Without one, the
            GeneHub mark is used.
          </span>
        </div>

        {canEdit ? (
          <button type="submit" className="branding__save" disabled={saving}>
            {saving ? 'Saving…' : 'Save branding'}
          </button>
        ) : (
          <p className="branding__hint">Only owners and admins can change these.</p>
        )}
      </form>
    </>
  );
}
