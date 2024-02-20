new Vue({
  el: '#app',
});

Vue.component('Board', {
  template: `
    <div class="board">
      <form @submit.prevent="addCard">
        <input v-model="newCardTitle" placeholder="Название карточки" required>
        <div v-for="(item, index) in newCardItems" :key="index">
          <input v-model="item.text" placeholder="название пункта">
          <button type="button" @click="removeItem(index)" v-if="newCardItems.length > 3">-</button>
        </div>
        <button type="button" @click="addItem" v-if="newCardItems.length < 5">+</button>
        <button type="submit">Добавить</button>
      </form>
      <Column title="0%" maxCards="3"></Column>
      <Column title="50%" maxCards="5"></Column>
      <Column title="100%"></Column>
    </div>
  `,
  data() {
    return {
      newCardTitle: '',
      newCardItems: Array.from({ length: 3 }, () => ({ text: '' })),
    };
  },
  methods: {
    addCard() {
      const validItems = this.newCardItems.filter(item => item.text.trim() !== '');
      if (validItems.length < 3) {
        alert('Карточка должна содержать минимум 3 пункив');
        return;
      }
    },
    addItem() {
      this.newCardItems.push({ text: '' });
    },
    removeItem(index) {
      this.newCardItems.splice(index, 1);
    },
  },
});

Vue.component('Column', {
  props: ['title', 'maxCards'],
  template: `
    <div class="column">
      <h2>{{ title }}</h2>
      <div class="cards">
        <Card v-for="card in cards" :key="card.id" :card="card"></Card>
      </div>
    </div>
  `,
  data() {
    return {
      cards: [],
    };
  },
  methods: {
    addCard() {
      if (!this.maxCards || this.cards.length < this.maxCards) {
        this.cards.push({ id: Date.now() });
      }
    },
  },
});

Vue.component('Card', {
  props: ['card'],
  template: `
    <div class="card">
      <h3>Card {{ card.id }}</h3>
      <ul>
        <ListItem v-for="item in card.items" :key="item.id" :item="item"></ListItem>
      </ul>
    </div>
  `,
  data() {
    return {
      items: [],
    };
  },
  methods: {
    addItem() {
      this.items.push({ id: Date.now(), checked: false });
    },
  },
});

Vue.component('ListItem', {
  props: ['item'],
  template: `
    <li>
      <input type="checkbox" v-model="item.checked">
      <span>{{ item.text }}</span>
    </li>
  `,
});

new Vue({
  el: '#app',
});
