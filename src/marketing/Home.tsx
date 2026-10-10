import { Link } from 'react-router-dom';
import { Board, LockIcon } from '../frames/Board';
import { RegistryTable } from '../frames/Registry';
import { ChannelList } from '../frames/Channels';
import { DEMO_NOW, demoChannels, demoRegistry, demoRows } from '../frames/demo';
import { PROVIDERS, KINDS } from '../lib/catalog';
import { Frame, MarketingLayout, newTab } from './Layout';
import { PricingTable } from './PricingTable';
import { Faq } from './Faq';

const NEW_USERS_14D = [4, 7, 3, 9, 6, 11, 8, 5, 12, 9, 7, 13, 10, 14];

export default function Home() {
  return (
    <MarketingLayout>
      <section className="hero">
        <div className="mk-wrap">
          <div className="hero-copy">
            <h1>Every app you’ve shipped, on one board.</h1>
            <p className="hero-lede">
              KriosityOps remembers which database account, project ref, host and repo each of your apps lives on. It shows when you last posted about
              each one, and who is working on it right now.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="/signup" {...newTab}>
                Start free
              </a>
              <Link className="btn btn-ghost" to="/pricing">
                See pricing
              </Link>
            </div>
            <p className="hero-note">Free for 2 apps. No card needed.</p>
          </div>
        </div>
        <div className="mk-wrap hero-board">
          <Frame path="/app">
            <div className="frame-toolbar">
              <strong>Your apps</strong>
              <span className="board-muted">4 apps, 1 channel overdue</span>
            </div>
            <Board rows={demoRows} now={DEMO_NOW} animate caption="Example board with four apps" />
          </Frame>
          <ul className="hero-legend" aria-label="What the lamps mean">
            <li>
              <span className="lamp lamp-ok" /> Posted on schedule
            </li>
            <li>
              <span className="lamp lamp-due" /> A post is due
            </li>
            <li>
              <span className="lamp lamp-late" /> Gone quiet
            </li>
            <li>
              <span className="lamp lamp-never" /> Never posted
            </li>
          </ul>
        </div>
      </section>

      <section className="pains" aria-labelledby="pains-h">
        <div className="mk-wrap">
          <h2 id="pains-h">Somewhere around app number four, things start to slip.</h2>
          <div className="pains-grid">
            <div>
              <h3>“Which Supabase account was that on?”</h3>
              <p>Free tiers cap your projects, so you open a second account, then a third. Nobody keeps the list.</p>
            </div>
            <div>
              <h3>“When did I last post about this one?”</h3>
              <p>The newest app gets all the attention. The others go quiet on X and Reddit without anyone noticing.</p>
            </div>
            <div>
              <h3>“Two AI tools just edited the same database.”</h3>
              <p>You handed one app to Claude and another to ChatGPT, and both ended up in the same project.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="feat" id="registry" aria-labelledby="reg-h">
        <div className="mk-wrap feat-grid">
          <div className="feat-copy">
            <h2 id="reg-h">Write down where everything lives, once.</h2>
            <p>
              Each app keeps a list of what it runs on. Pick the type and provider from a list, add the account and project, and you’re done. Add as many
              as an app needs, so a frontend on one host and a server on another fits fine.
            </p>
            <ul className="feat-points">
              <li>Supabase refs and GitHub repos become links straight to their console.</li>
              <li>Identifiers only. Passwords and service keys never go in.</li>
              <li>Any provider works. The list is a shortcut, not a limit.</li>
            </ul>
          </div>
          <Frame path="/app/invoicely" className="feat-frame">
            <div className="frame-toolbar">
              <strong>Invoicely</strong>
              <span className="board-muted">Where it lives</span>
            </div>
            <RegistryTable items={demoRegistry} />
          </Frame>
        </div>
      </section>

      <section className="feat feat-flip" aria-labelledby="soc-h">
        <div className="mk-wrap feat-grid">
          <div className="feat-copy">
            <h2 id="soc-h">See which channel has gone quiet.</h2>
            <p>
              Add the places you post for each app and how often you mean to post there. After you post, log it with the link. The lamp turns amber when
              a post is due and red once you’ve missed it twice over.
            </p>
            <ul className="feat-points">
              <li>One log per app, per platform: X, Reddit, LinkedIn, Pinterest and more.</li>
              <li>Keep every post link, so you can find what worked.</li>
              <li>The board shows each app’s quietest channel at a glance.</li>
            </ul>
          </div>
          <Frame path="/app/invoicely/social" className="feat-frame">
            <div className="frame-toolbar">
              <strong>Invoicely</strong>
              <span className="board-muted">Social log</span>
            </div>
            <ChannelList items={demoChannels} now={DEMO_NOW} />
          </Frame>
        </div>
      </section>

      <section className="pair" aria-label="More features">
        <div className="mk-wrap pair-grid">
          <div className="pair-item">
            <div className="pair-visual" aria-hidden="true">
              <span className="pair-lock">
                <LockIcon /> Claude is working on it
              </span>
              <span className="board-muted pair-since">since 9:40 this morning</span>
            </div>
            <h2>Mark who’s working on an app.</h2>
            <p>
              Before you hand an app to Claude, ChatGPT, Cursor or a teammate, mark it. The marker sits on the board, so nobody else starts work on the same
              project by mistake.
            </p>
          </div>
          <div className="pair-item">
            <div className="pair-visual" aria-hidden="true">
              <svg className="spark" viewBox="0 0 280 64" preserveAspectRatio="none">
                {NEW_USERS_14D.map((v, i) => (
                  <rect key={i} x={i * 20 + 2} y={64 - v * 4.4} width="14" height={v * 4.4} rx="2" fill={i === NEW_USERS_14D.length - 1 ? 'var(--cobalt)' : 'var(--line-2)'} />
                ))}
              </svg>
              <span className="pair-figure">
                <strong>+14</strong> new users today <span className="board-muted">of 1,286</span>
              </span>
            </div>
            <h2>New users every morning.</h2>
            <p>
              Add one small read-only function to each Supabase project. At 6 AM IST, KriosityOps collects new and total users with your Vercel visitors and
              keeps a daily snapshot. Rolling out to Pro next.
            </p>
          </div>
        </div>
      </section>

      <section className="stack" aria-labelledby="stack-h">
        <div className="mk-wrap">
          <h2 id="stack-h">Works with whatever you build on.</h2>
          <dl className="stack-list">
            {KINDS.filter((k) => PROVIDERS[k.id].length).map((k) => (
              <div key={k.id}>
                <dt>{k.label}</dt>
                <dd>{PROVIDERS[k.id].join(', ')}, or any other.</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="pricing" id="pricing" aria-labelledby="price-h">
        <div className="mk-wrap">
          <h2 id="price-h">Free for two apps. One price after that.</h2>
          <PricingTable headingLevel={3} />
        </div>
      </section>

      <section className="faqs" aria-labelledby="faq-h">
        <div className="mk-wrap faq-wrap">
          <h2 id="faq-h">Questions</h2>
          <Faq />
        </div>
      </section>

      <section className="closer">
        <div className="mk-wrap closer-inner">
          <h2>Put your apps on the board.</h2>
          <p>Takes about five minutes for your first app.</p>
          <a className="btn btn-primary" href="/signup" {...newTab}>
            Create a free account
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
