import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Shield, Book, Mic } from 'lucide-react';
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="w-full py-12 md:py-20 text-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block p-2 bg-blue-50 rounded-full text-blue-700 font-medium text-sm px-4 mb-2"
        >
          USCIS Citizenship Test Prep
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight"
        >
          Master Your <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500">
            Civics Dictation
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto"
        >
          Practice reading and writing English sentences for your naturalization interview. Listen, write, and verify your answers instantly.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link to={createPageUrl('Practice')}>
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-transform hover:scale-105">
              Start Practicing Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="w-full py-12 grid md:grid-cols-3 gap-8">
        {[
          { icon: Mic, title: "Dictation Practice", desc: "Listen to official USCIS vocabulary sentences spoken clearly." },
          { icon: Book, title: "Writing Skills", desc: "Write the sentences on paper or type them to improve your spelling." },
          { icon: Shield, title: "Official Content", desc: "Based on the official USCIS vocabulary lists for the 2008 civics test." },
        ].map((feature, idx) => (
          <Card key={idx} className="border-0 shadow-md bg-white/60 backdrop-blur hover:bg-white transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900">{feature.title}</h3>
              <p className="text-slate-600">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

    </div>
  );
}