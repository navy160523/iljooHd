<template>
  <v-card>
    <v-card-title>
      <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
            @click-button="onButtonsClick"
          /> 
    </v-card-title>
    <v-card-text class="card-text-content">
      <v-sheet>

        <v-card
          class="mx-auto pa-2"
          color="primary"
        >
          <v-card-item class=" bg-white">
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2 mt-2"
          variant="outlined"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card
          class="mx-auto pa-2"
          color="primary"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ variant }}
              </div>
              <div class="text-h6 mb-1">
                Headline
              </div>
              <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
            </div>
          </v-card-item>
          <v-card-actions>
            <v-btn>
              Button
            </v-btn>
          </v-card-actions>
        </v-card>

      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useLogsStore } from "@hiway/stores/logs"
import IMenuTitle from "@/components/IMenuTitle.vue"
</script>

<style lang="scss" scoped>

.card-text-content {

  height: calc(100vh - 128px - 49px);
  overflow: auto;  
}

</style>
