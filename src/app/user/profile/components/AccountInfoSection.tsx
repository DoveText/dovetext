'use client';

interface AccountInfoSectionProps {
  profileData: any;
}

export default function AccountInfoSection({ profileData }: AccountInfoSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Account Information</h4>
      <dl className="divide-y divide-gray-200">
        <div className="py-3 flex justify-between text-sm">
          <dt className="text-gray-500">Member since</dt>
          <dd className="text-gray-900">
            {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleString() : 'N/A'}
          </dd>
        </div>
        <div className="py-3 flex justify-between text-sm">
          <dt className="text-gray-500">Last sign in</dt>
          <dd className="text-gray-900">
            {profileData?.lastLoginAt ? new Date(profileData.lastLoginAt).toLocaleString() : 'N/A'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
