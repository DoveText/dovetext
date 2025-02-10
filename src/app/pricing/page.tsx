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
      'SMS and Voice notifications',
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
    <div className="min-h-screen">
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              DoveText: AI Intelligence Meets Smart Notifications
            </h1>
            <p className="mt-6 text-2xl leading-8 text-gray-600">
              Enjoy the power of AI without the noise - stay focused on what matters most
            </p>
            <div className="mt-20">
              <p className="text-2xl font-semibold text-blue-600">
                Simple, transparent pricing that grows with you
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Pay only for what you need, cancel anytime
              </p>
            </div>
          </div>

          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={classNames(
                  tier.mostPopular 
                    ? 'ring-2 ring-blue-600 bg-white' 
                    : 'ring-1 ring-gray-200 bg-white/60 hover:bg-white',
                  'rounded-3xl p-8 xl:p-10 transition-all duration-200',
                  tier.comingSoon ? 'opacity-50' : ''
                )}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h2
                    id={tier.id}
                    className={classNames(
                      tier.mostPopular ? 'text-blue-600' : 'text-gray-900',
                      'text-lg font-semibold leading-8'
                    )}
                  >
                    {tier.name}
                  </h2>
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
                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500'
                        : 'text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300',
                      'mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    )}
                  >
                    Start free!
                  </a>
                ) : (
                  <p className="mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-gray-400 bg-gray-100">
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
    </div>
  );
}
