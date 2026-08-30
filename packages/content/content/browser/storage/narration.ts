import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Four places that look alike',
    heading: 'Why this matters',
    script: `Storage is where the page's data goes when the tab closes, and it is
      last in this track because it only makes sense once you know what a page
      is: something thrown away on every navigation.

      It is also the topic with the highest ratio of confident wrong answers,
      because three of the four options look interchangeable and are not. One is
      synchronous and blocks the main thread. One is sent to your server on every
      single request. One is the only one that can hold anything other than a
      string.

      And the question an interviewer actually wants to ask, which is where a
      session token belongs, has no comfortable answer at all. That one is the
      last section, and it is the reason this topic is worth more than its size.`,
  },
  {
    title: 'What each one costs',
    heading: 'The four places',
    script: `Local storage. Synchronous, strings only, five to ten megabytes, one
      copy for the whole origin, kept until something deletes it. Never sent
      anywhere.

      Session storage. The same interface and the same limits, scoped to one tab
      and discarded when that tab closes.

      Cookies. Synchronous, strings only, about four kilobytes each, with a
      browser cap on how many a domain can have, and an expiry. And attached to
      every single request your browser makes to that origin.

      Indexed D B. Asynchronous, transactional, hundreds of megabytes, and the
      only one of the four that stores things other than strings.

      Everything here is per origin, and an origin is scheme, host and port, all
      three. A page on plain h t t p and a page on h t t p s cannot see each
      other's storage, which is occasionally a very confusing afternoon.

      There is a fifth place worth knowing exists, the cache A P I. It stores
      whole responses, it is asynchronous, and it is what a service worker uses
      to serve a page offline. It is not a general key value store and it does
      not compete with these four.`,
  },
  {
    title: 'Everything is a string',
    heading: 'Web storage, and what a string costs',
    script: `Local storage and session storage are the same interface with
      different lifetimes. One survives until something deletes it, the other
      lives as long as the tab, survives a reload, and is copied into a tab
      opened from a link.

      Every value is a string. Not converted helpfully for you: coerced, the way
      string concatenation coerces. Store the number five and it comes back as
      the text five, so adding one to it gives you fifty one. Store an object and
      it comes back as the literal text object Object, and the data is gone.

      So the round trip is yours to write, and both halves of it can fail. A half
      written value from an older version of your code, or a key someone edited
      in devtools, is a syntax error thrown while the module is still evaluating,
      and the page renders nothing at all. Reads belong in one function that
      catches, returns the default, and removes the bad key.

      A missing key gives you null, never undefined.

      The real cost is that it is synchronous. Every read and write blocks the
      main thread, including the disk underneath it, and it is shared across
      tabs, so a read can block behind another tab's write. That is fine for a
      theme. Reading a megabyte of J S O N out of it at startup parses that
      megabyte before your first paint.

      The quota is five to ten megabytes for the origin, and going past it
      throws. Private browsing modes have historically had a quota of zero, so
      that is a failure you will never see in development.

      And the storage event fires in every other tab on the origin, never in the
      one that wrote. This catches everyone once. It is also the simplest way to
      log a user out of every tab at the same moment.`,
  },
  {
    title: 'A message to the server',
    heading: 'Cookies are not storage',
    script: `A cookie is a mechanism for telling a server something, and it
      happens to persist on the way past. That framing is the whole topic.

      Every cookie for the origin is attached to every request to it. Images,
      scripts, A P I calls, all of them. Four kilobytes of cookies on a page with
      fifty requests is two hundred kilobytes of upload, for data your JavaScript
      could have kept for free. That is why reaching for a cookie is the wrong
      instinct for anything that is not for the server.

      The interface is a historical accident. Assigning to the cookie property on
      document sets exactly one cookie. Reading it gives you all of them
      concatenated into one string, with no way to see any attribute.

      The attributes are where the questions are.

      Http only makes the cookie invisible to JavaScript. Script cannot read it
      and cannot overwrite it. Only a server can set that flag, and it is the
      single most important one for anything that authenticates.

      Secure sends it only over h t t p s.

      Same site decides whether it goes with cross site requests. Lax is the
      modern default and sends it on top level navigation, but not on a cross
      site fetch or form post. Strict never sends it cross site. None always
      does, and requires secure.

      Max age or expires make it persistent. Without either, it dies with the
      browser.

      Same site lax is most of the answer to cross site request forgery, and most
      is carrying weight there. It is a default rather than a guarantee, so a
      server that cares still wants a token.`,
  },
  {
    title: 'The one that is a database',
    heading: 'IndexedDB, and when you need it',
    script: `Indexed D B is the real database. Asynchronous, transactional,
      hundreds of megabytes, indexed lookups, and the only one of the four that
      stores things other than strings.

      It uses the structured clone algorithm rather than J S O N, and that is a
      bigger difference than it sounds. Structured clone keeps dates, maps, sets,
      regular expressions, array buffers, blobs and files, and it handles cycles.
      Through J S O N, a date becomes a string, a set becomes an empty object,
      and a file cannot go at all. What structured clone refuses is functions,
      symbols, D O M nodes, and class identity, so an instance comes back as a
      plain object with the same properties on it.

      The raw interface is event based, verbose, and older than promises, and
      nobody writes it by hand. Use a wrapper. Saying that in an interview is a
      better answer than reciting the event names, provided you can also say what
      a version, an object store, a key path and an index are.

      And one rule that surprises everybody. A transaction is active for the task
      that created it and for the callbacks of its own requests, and it commits
      itself as soon as control returns to the event loop with nothing pending.
      Nothing closes it and there is no way to hold it open. So awaiting anything
      that is not part of the transaction ends it, and the write after that await
      throws. Await nothing inside a transaction except the transaction's own
      requests.

      Reach for it when the data is large, structured, queried rather than read
      whole, or simply not a string. Reach for local storage when it is a
      preference. Between those two, most applications want the database and use
      local storage because it is one line.`,
  },
  {
    title: 'The uncomfortable answer',
    heading: 'Where a token should live',
    script: `This is asked in most front end interviews, the expected answer is
      not local storage, and the reasoning matters far more than the answer.

      Local storage is readable by any JavaScript on the page. That includes
      every dependency, every script a dependency loads, and anything an attacker
      injects. One cross site scripting hole reads the token and sends it
      somewhere, and it keeps working from the attacker's machine.

      An http only cookie is not readable by script at all. An attacker with a
      script on your page can still make requests as the user, because the
      browser attaches the cookie for them, but they cannot take the token away
      with them. The damage is confined to your origin and to the time your page
      is open. That is a real and meaningful difference, and it is why the cookie
      is the better default.

      The cost is that a cookie sent automatically is sent on requests the user
      never initiated, which is cross site request forgery. Same site lax handles
      most of it, and a C S R F token handles the rest.

      Then the honest summary, which is what a good interviewer is listening for.
      Cross site scripting defeats both. With script running on your page, an
      attacker can act as the user whatever you did with the token. Http only
      limits the blast radius, it does not remove it, and the real defences are a
      content security policy, output encoding, and not shipping the hole.

      The pattern most teams land on: a short lived access token in memory only,
      in a variable that dies with the page, and a long lived refresh token in an
      http only, secure, same site cookie, scoped to the refresh endpoint alone.
      Nothing durable is ever readable by script, and a reload costs one refresh
      call.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked to compare local storage and session storage, say: same
      interface, different lifetime and scope. Session storage is per tab and
      dies with it, local storage is per origin and persists. Then say the thing
      neither name tells you, which is that both are synchronous and both hold
      only strings.

      Asked why application state does not belong in local storage, give four
      reasons. Synchronous, so every access blocks the main thread including the
      disk. Strings only, so everything is a serialise and a parse. Five
      megabytes. And no transactions, so two tabs writing at once is a lost
      update. Indexed D B is the answer to all four.

      Asked where a J W T goes, say not local storage, because any script on the
      page can read it. An http only cookie, with secure and same site, plus
      cross site request forgery protection. Then be honest that cross site
      scripting defeats both, and that this limits the damage rather than
      preventing it.

      Asked what same site does, say it decides whether the cookie is attached to
      cross site requests, and that lax, the default, allows top level navigation
      but not a cross site fetch or form post.

      Expect a follow up asking why the database keeps a date and J S O N does
      not, and answer it with structured clone.`,
  },
]
