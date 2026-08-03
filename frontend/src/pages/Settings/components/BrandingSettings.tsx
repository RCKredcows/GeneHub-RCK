import { useEffect, useState, type FormEvent } from 'react';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';
import {
  fetchBranding,
  updateBranding,
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
  invalid_logo: 'A logo must be a path starting with / or an https address.',
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
    key: 'logoUrl',
    label: 'Logo',
    hint: 'Shown on the sign-in screen. A path like /logo.svg, or an https address.',
    placeholder: '/logo.svg',
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

        {branding.logoUrl && (
          <div className="branding__preview">
            <span className="branding__label">Preview</span>
            {/* Nothing but the image: a broken URL should look broken here
                rather than on the sign-in screen. */}
            <img src={branding.logoUrl} alt="" />
          </div>
        )}

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
