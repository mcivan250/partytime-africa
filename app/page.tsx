import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-2xl">
            Party Time Africa
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-12 font-light">
            Turn up, African style. 🎉
          </p>

          <div className="space-y-4">
            <Link
              href="/create"
              className="inline-block bg-white text-purple-600 px-10 py-4 rounded-full text-xl font-bold hover:scale-105 transition shadow-2xl"
            >
              Create Your Event
            </Link>

            <p className="text-white/80 text-sm mt-8">
              Beautiful invites • Easy RSVPs • 100% Free
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            <Link href="/create" className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-bold text-lg mb-2">Create Events</h3>
              <p className="text-white/80 text-sm">
                Beautiful invites, RSVP tracking, guest lists
              </p>
            </Link>

            <Link href="/venues" className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition">
              <div className="text-4xl mb-3">🍽️</div>
              <h3 className="font-bold text-lg mb-2">Book Tables</h3>
              <p className="text-white/80 text-sm">
                Reserve VIP booths, rooftop tables at top venues
              </p>
            </Link>

            <Link href="/brunch" className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition">
              <div className="text-4xl mb-3">🥂</div>
              <h3 className="font-bold text-lg mb-2">Sunday Brunch</h3>
              <p className="text-white/80 text-sm">
                Bottomless brunches, live music, unlimited vibes
              </p>
            </Link>

            <Link href="/wallet" className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-bold text-lg mb-2">Pay Your Way</h3>
              <p className="text-white/80 text-sm">
                Mobile Money, installments, wallet system
              </p>
            </Link>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="font-bold text-lg mb-2">WhatsApp Native</h3>
              <p className="text-white/80 text-sm">
                Share, remind, confirm — where Africa lives
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-bold text-lg mb-2">Afrocentric</h3>
              <p className="text-white/80 text-sm">
                Ankara themes, African vibes, built for us
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-white/60 text-sm">
        Made with ❤️ in Uganda
      </div>
    </div>
  );
}
