import { CheckIcon } from '@heroicons/react/20/solid';

const tiers = [
  {
    name: 'Lite',
    id: 'tier-lite',
    href: '/signup',
    price: { monthly: '$5' },
    description: 'Perfect for getting started with smart notifications.',
    features: [
      'Up to 50 notifications per month',
      'Unlimited DoveApp notifications',
      'Email notifications',
      'Basic text analysis',
      'Standard support',
    ],
    mostPopular: true,
    beta: true,
    betaPrice: 'Free during beta',
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '#',
    price: { monthly: '$15' },
    description: 'Ideal for power users who need more advanced features.',
    features: [
      'Up to 500 notifications per month',
      'Unlimited DoveApp notifications',
      'Text and Voice notifications',
      'Plugin and / or Webhook notifications',
      'Custom notification rules',
      'Advanced text analysis',
      'API access',
      'Priority support',
    ],
    mostPopular: false,
    comingSoon: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    price: { monthly: 'Custom' },
    description: 'Dedicated support and infrastructure for your company.',
    features: [
      'Unlimited notifications',
      'Advanced notification rules with escalation chains',
      'Custom integrations',
      'Enterprise-grade text analysis',
      '24/7 dedicated support',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    mostPopular: false,
    comingSoon: true,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            DoveText: AI Intelligence Meets Smart Notifications
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            Enjoy the power of AI without the noise - stay focused on what matters most
          </p>
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-blue-600">
              Simple, transparent pricing that grows with you
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Pay only for what you need, cancel anytime
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular 
                  ? 'ring-2 ring-blue-600' 
                  : 'ring-1 ring-gray-200',
                'rounded-lg bg-white shadow-sm px-6 py-8 transition-all duration-200',
                tier.comingSoon ? 'opacity-75' : ''
              )}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={classNames(
                    tier.mostPopular ? 'text-blue-600' : 'text-gray-900',
                    'text-lg font-semibold leading-8'
                  )}
                >
                  {tier.name}
                </h3>
                {tier.mostPopular && (
                  <p className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                    Most popular
                  </p>
                )}
                {tier.beta && (
                  <p className="rounded-full bg-green-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-green-600">
                    Beta
                  </p>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
              {tier.beta ? (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-red-500 line-through italic">
                    Free for first 30 days, $5/month
                  </p>
                  <p className="flex items-baseline gap-x-1">
                    <span className="text-lg font-semibold tracking-tight text-green-600">Free In Beta</span>
                  </p>
                </div>
              ) : (
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price.monthly}</span>
                  {tier.price.monthly !== 'Custom' && <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>}
                </p>
              )}
              {!tier.comingSoon ? (
                <a
                  href={tier.href}
                  aria-describedby={tier.id}
                  className={classNames(
                    tier.mostPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300',
                    'mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                  )}
                >
                  Start free!
                </a>
              ) : (
                <p className="mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-gray-400 bg-gray-50">
                  Coming Soon
                </p>
              )}
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
