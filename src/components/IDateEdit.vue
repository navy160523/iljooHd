<script setup>


const date = ref('2019-02-01')
</script>

<template>
  <div class="q-pa-md" style="max-width: 300px">
    <VTextField v-model="date">
      <template #append-inner>
        <VIcon icon="mdi-calendar" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="date" minimal >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </VIcon>
      </template>
    </VTextField>
  </div>
</template>
