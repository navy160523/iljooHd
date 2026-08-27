<template>
  <div>
    <h2>API 테스트</h2>
    <div>
      <label for="url">URL:</label>
      <input type="text" id="url" v-model="url" placeholder="http://example.com/api/test">
    </div>
    <div>
      <label for="method">메서드:</label>
      <select id="method" v-model="method">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
      </select>
    </div>
    <div v-if="method === 'POST'">
      <label for="body">Body (JSON):</label>
      <textarea id="body" v-model="body" rows="10" placeholder='{"key": "value"}'></textarea>
    </div>
    <div v-if="method === 'GET'">
      <label for="params">파라미터:</label>
      <input type="text" id="params" v-model="params" placeholder="key=value&key2=value2">
    </div>
    <button @click="testApi">API 호출</button>

    <div v-if="result">
      <h3>결과</h3>
      <pre>{{ result }}</pre>
    </div>
    <div v-if="error">
      <h3>에러</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { commonApiTest } from '@hiway/api/commonApi'


const url = ref('');
const method = ref('GET');
const body = ref('');
const params = ref('');
const result = ref(null);
const error = ref(null);

const testApi = async () => {
  result.value = null;
  error.value = null;

  try {

    const payload = {
      url: url.value,
      method: method.value,
      body: method.value === 'POST' ? body.value : undefined,
      params: method.value === 'GET' ? params.value : undefined
    };

    const response = await commonApiTest(payload)



    result.value = response.data;





  } catch (err) {
    if (err.response) {
      error.value = err.response.data;
    } else {
      error.value = err.message;
    }
  }
};
</script>

<style scoped>
/* 간단한 스타일링 */
div { margin-bottom: 1em; }
input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
button { padding: 10px 15px; cursor: pointer; }
pre { background-color: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
</style>