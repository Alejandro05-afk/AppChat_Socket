Esta es una guía de migración estructurada como una **Skill técnica** paso a paso para tu proyecto.

Lo mejor de haber implementado **Clean Architecture** en tu aplicación es que **no vas a tocar una sola línea de código en tus pantallas de Tamagui ni en tus Casos de Uso**. Todo el cambio se concentrará exclusivamente en la capa de **Infraestructura** y en la inicialización del cliente de servicios externos.

---

# 🛠️ Skill de Migración: De Supabase Realtime a Appwrite Events

## 📋 Resumen del Cambio Técnico

* **Antes (Supabase):** Te suscribías a canales con `.channel()` y escuchabas eventos de Postgres (`postgres_changes`) usando un payload del tipo `payload.new`.
* **Ahora (Appwrite):** Usarás el SDK de Appwrite (`appwrite`) mediante su método `client.subscribe()`, escuchando canales basados en strings de recursos (ej: `databases.[databaseId].collections.[collectionId].documents`).

---

## 🏎️ Paso 1: Instalación de Dependencias y Configuración Inicial

Primero, instalamos el SDK oficial de Appwrite para entornos de React Native y actualizamos nuestras variables de entorno.

```bash
npm install react-native-appwrite

```

Modifica tu archivo de configuración o cliente global (`src/shared/infrastructure/config/appwrite.ts` o equivalente):

```typescript
import { Client, Databases, Account, Storage } from 'react-native-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // O tu IP local/VPS
    .setProject('TU_PROJECT_ID_DE_APPWRITE');

export const databases = new Databases(client);
export const account = new Account(client);
export const storage = new Storage(client);
export { client as appwriteClient }; // Lo necesitamos para las suscripciones en tiempo real

```

---

## 🔄 Paso 2: Equivalencia de Conceptos en Tiempo Real

Para mapear tu lógica actual, ten en cuenta cómo cambian los tópicos de suscripción:

| Característica | Supabase Realtime | Appwrite Realtime |
| --- | --- | --- |
| **Suscripción General** | `.channel('room_api')` | `client.subscribe('...', callback)` |
| **Canal de una Tabla** | `postgres_changes`, table: 'messages' | `databases.[dbId].collections.[messagesCollectionId].documents` |
| **Filtro por Fila / Sala** | `filter: 'room_id=eq.' + roomId` | `databases.[dbId].collections.[messagesCollectionId].documents.[docId]` * |

> 💡 *Nota de arquitectura:* Appwrite Realtime a nivel de cliente te permite suscribirte a toda la colección o a un documento específico. Para filtrar mensajes por una sala (`roomId`) en tiempo real, te suscribes a la colección entera de mensajes y haces un filtro rápido en memoria dentro del callback (`if (payload.events.includes('...') && payload.payload.roomId === roomId)`), emulando el comportamiento previo.

---

## 💻 Paso 3: Refactorización del Repositorio (`Infrastructure`)

Gracias a **SOLID (DIP)**, solo modificamos la clase concreta que implementa tu interfaz `IChatRepository`. Así es como se transforma el código de escucha en tiempo real:

### Código Antiguo (Supabase)

```typescript
// src/features/chat/infrastructure/repositories/SupabaseChatRepository.ts
subscribeToMessages(roomId: string, onMessageReceived: (message: Message) => void) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages', 
      filter: `room_id=eq.${roomId}` 
    }, (payload) => {
      onMessageReceived(payload.new as Message);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

```

### Código Nuevo (Appwrite)

```typescript
// src/features/chat/infrastructure/repositories/AppwriteChatRepository.ts
import { appwriteClient } from '../../../shared/infrastructure/config/appwrite';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Message } from '../../domain/entities/Message';

export class AppwriteChatRepository implements IChatRepository {
  
  subscribeToMessages(roomId: string, onMessageReceived: (message: Message) => void): () => void {
    const DATABASE_ID = 'tu_database_id';
    const COLLECTION_ID = 'tu_collection_id_messages';

    // Nos suscribimos a todos los eventos de documentos en la colección de mensajes
    const unsubscribe = appwriteClient.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`, 
      (response) => {
        // Appwrite dispara eventos como: databases.*.collections.*.documents.*.create
        const isInsert = response.events.some(event => event.endsWith('.create'));
        const payloadData = response.payload as any;

        // Validamos que sea un insert y pertenezca a la sala actual (Filtro en memoria)
        if (isInsert && payloadData.room_id === roomId) {
          const newMessage: Message = {
            id: payloadData.$id,
            roomId: payloadData.room_id,
            senderId: payloadData.sender_id,
            text: payloadData.text,
            createdAt: new Date(payloadData.$createdAt)
          };
          onMessageReceived(newMessage);
        }
      }
    );

    // Retornamos la función de limpieza para remover la suscripción (clean-up function)
    return unsubscribe;
  }
}

```

---

## 🔄 Paso 4: Inyección de Dependencias (El toque final de Clean Architecture)

Para que toda tu aplicación empiece a usar Appwrite de golpe sin romper nada, ve al archivo donde instancias tus Hooks o tus Casos de Uso (donde creabas el repositorio antiguo) y cambia la instancia:

```typescript
// src/features/chat/presentation/hooks/useChat.ts

// ANTES: const chatRepository = new SupabaseChatRepository();
// AHORA:
const chatRepository = new AppwriteChatRepository(); 

const getMessagesUseCase = new GetMessagesUseCase(chatRepository);
const sendMessageUseCase = new SendMessageUseCase(chatRepository);

```

¡Listo! Con esto, tus hooks de React, componentes de **Tamagui** y animaciones de **Lottie** seguirán funcionando de forma idéntica, ignorando por completo que el motor de tiempo real debajo cambió de dueño.