import React from 'react';
import {
  Wand2, Briefcase, Handshake, Plane, UtensilsCrossed, Coffee,
  Phone, ShoppingCart, Users, BookOpen, Mic, Languages, MessageSquare,
  Dumbbell, Home
} from 'lucide-react';

/**
 * Dynamically selects a fitting Lucide Icon based on scenario title and description.
 * Useful for user-generated custom scenarios.
 */
export function getScenarioIcon(title: string, description: string): React.ElementType {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('interview') || text.includes('entrevista') || text.includes('vaga') || text.includes('career') || text.includes('currículo')) {
    return Briefcase;
  }
  if (text.includes('business') || text.includes('meeting') || text.includes('reunião') || text.includes('negócio') || text.includes('corporate') || text.includes('email') || text.includes('trabalho') || text.includes('work') || text.includes('venda') || text.includes('sales')) {
    return Handshake;
  }
  if (text.includes('travel') || text.includes('trip') || text.includes('viagem') || text.includes('voo') || text.includes('flight') || text.includes('airport') || text.includes('aeroporto') || text.includes('hotel') || text.includes('vacation')) {
    return Plane;
  }
  if (text.includes('food') || text.includes('restaurant') || text.includes('restaurante') || text.includes('dinner') || text.includes('jantar') || text.includes('almoço') || text.includes('lunch') || text.includes('eat') || text.includes('menu') || text.includes('comida') || text.includes('pedir') || text.includes('cozinha') || text.includes('kitchen')) {
    return UtensilsCrossed;
  }
  if (text.includes('coffee') || text.includes('café') || text.includes('breakfast') || text.includes('cafe')) {
    return Coffee;
  }
  if (text.includes('phone') || text.includes('call') || text.includes('telefone') || text.includes('ligação')) {
    return Phone;
  }
  if (text.includes('shop') || text.includes('store') || text.includes('loja') || text.includes('buy') || text.includes('comprar') || text.includes('market') || text.includes('supermercado') || text.includes('price') || text.includes('pagar') || text.includes('pay')) {
    return ShoppingCart;
  }
  if (text.includes('friend') || text.includes('social') || text.includes('party') || text.includes('festa') || text.includes('people') || text.includes('amigo') || text.includes('conversar') || text.includes('conversa')) {
    return Users;
  }
  if (text.includes('grammar') || text.includes('gramática') || text.includes('rule') || text.includes('learn') || text.includes('study') || text.includes('estudar') || text.includes('book') || text.includes('livro')) {
    return BookOpen;
  }
  if (text.includes('pronunciation') || text.includes('pronúncia') || text.includes('speak') || text.includes('falar') || text.includes('voice') || text.includes('voz') || text.includes('mic') || text.includes('fala')) {
    return Mic;
  }
  if (text.includes('vocabulary') || text.includes('vocabulário') || text.includes('word') || text.includes('palavra')) {
    return Languages;
  }
  if (text.includes('idiom') || text.includes('slang') || text.includes('gíria') || text.includes('expressão') || text.includes('chat')) {
    return MessageSquare;
  }
  if (text.includes('sport') || text.includes('gym') || text.includes('academia') || text.includes('fit') || text.includes('exercício') || text.includes('treino') || text.includes('run')) {
    return Dumbbell;
  }
  if (text.includes('home') || text.includes('house') || text.includes('casa') || text.includes('room') || text.includes('quarto') || text.includes('apartamento') || text.includes('apartment')) {
    return Home;
  }
  
  return Wand2; // Default for custom scenarios
}
