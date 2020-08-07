<script context="module">
  import { svId as CounterSvId } from "../../../client/Counter.svelte";
  import { preload as preloadLayout } from "../layout/MainLayout.svelte";

  export const svId = [CounterSvId];

  export const preload = async (prisma, request) => {
    const layoutData = await preloadLayout(prisma, request);

    return {
      layoutData
    };
  };
</script>

<script>
  import Layout from "../layout/MainLayout.svelte";
  import Container from "../layout/Container.svelte";
  import { _, setCurrentLocale } from "../modules/intl";

  export let locale;

  setCurrentLocale(locale);

  export let data;
</script>

<Layout data={data.layoutData} title={_('Art gardeners')}>
  <Container>
    <section>
      <h1>Grow art communities</h1>

      <p>
        Find people sharing the same interests and improve your crafts together.
      </p>
    </section>

    <section>
      <h2>What's a garden?</h2>

      <p>
        A garden is a place where people will gather and share the same
        interests. It could be as large as oil painting or as specific as 8bit
        pixel art using the Commodore 64 palette. It could grow to thousands of
        people or chose to focus on a couple of people.
      </p>

      <p>
        The goal is to have a spot where you can share and improve your crafts
        along others.
      </p>
    </section>

    <section>
      <h2>How is it different than other art publishing platforms?</h2>

      <div>
        <h3>Community first</h3>
        <p>
          Nowadays, most of the public art platforms gravitates around social
          media. You need to get views and build your own brand to get some
          visibility.
        </p>

        <p>
          In our gardens the primary goal is not to promote oneselve, but to
          build relations and exchange tips with fellow artists.
        </p>

        <p>
          This means that you won't see statistics that promotes popularity
          (favorites, followers, ...) and instead will get the tools to make
          sure that your community thrive (moderation tools, events,
          communication, ...).
        </p>
      </div>

      <div>
        <h3>Feedback oriented</h3>

        <p>
          Engagment in art platforms is often driven by likes/favorites. These
          are great to get a motivation boost. But sometimes, you'd like to get
          more in depth feedback from fellow artists. Understand how you could
          do better or how your art inspires people.
        </p>

        <p>
          In art gardeners our goal is to provide the tools to do so. We are
          still very early in our development so we don't have much in place
          yet. But we are looking for ways to encourage those kind of feedbacks
          (ex: easily sketch over some artwork to explain how to improve the
          composition, post artworks citing another artist's creation to show
          how they inspired us, ...).
        </p>
      </div>

      <div>
        <h3>Community owned</h3>

        <p>
          While art platforms outthere are owned by a few and their evolutions
          is in their hand, art gardeners is community owned. This means that
          each garden can have their own policies and manage their communities
          however they want.
        </p>

        <p>This is possible thanks to two structural decisions:</p>

        <ul>
          <li>
            It's open source: the code that allows it to work is available
            freely and anyone could reuse it, change it and make it available
            elsewhere.
          </li>
          <li>
            It's decentralized: anyone could host a new instance of art
            gardeners elsewhere and people would still be able to communicate
            between instances.
          </li>
        </ul>
      </div>
    </section>

    <section>
      <h2>How can I get started?</h2>

      <p>
        Currently we are still in the early phases of the development. However,
        you can keep yourself updated by subscribing to this newsletter. We
        should send no more than 1 mail per month.
      </p>
      <p>
        If you are interested in finer updates, we will be posting updates on
        this blog and keep you informed on this Twitter account.
      </p>
    </section>

    <section>
      <h2>Pricing</h2>

      <p>
        Our goal is to find a pricing model that will allow us to make this
        platform sustainable while not relying on advertisment or selling your
        data.
      </p>

      <h3>Users</h3>
      <p>
        The usage is completly free. You can create an account on any public
        instance and start interacting in the different gardens available
        outthere.
      </p>

      <h3>Community creators</h3>
      <p>
        You can decide to host a new garden on our platform for a small monthly
        fee. We are not up and running yet so we didn't yet chose a hosting
        provider. But the main idea is that it will be a few dollars per month.
        You will be able to chose between paying the bare minimum (the hosting
        costs) or adding a bit every month that will go back to the developers
        of the platform and help improve
      </p>

      <h3>Private communities</h3>
      <p>
        In some cases you may want to create a private community. It can be
        because are useful for your work projects or because you've decided that
        you don't want to interact with outside communities. In this case, the
        price will vary depending on the number of users.
      </p>

      <h3>Technical creators</h3>
      <p>
        If you feel confortable with hosting your own solution garden, you can
        follow this documentation and also host your own garden elsewhere.
      </p>
    </section>

    <ul>
      <li>
        <em>Gardens</em>
        : Places gathering people sharing the same interests.
      </li>
      <li>
        <em>Interests first</em>
        : Instead of growing communities : focus on art instead of fame. You
        won't follow people, but
      </li>
    </ul>
  </Container>
</Layout>
