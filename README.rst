
################################
PyPSA-animation
################################

.. contents::

.. section-numbering::


About
=====

PyPSA-animation is a tool to convert results from the energy system
simulation tool `Python for Power System Analysis
<https://github.com/PyPSA/PyPSA>`_ to interactive web animations.

PyPSA-animation is built primarily in `JavaScript
<https://www.javascript.com/>`_ using the library `D3.js
<https://d3js.org/>`_.

It is released as `free software
<http://www.gnu.org/philosophy/free-sw.en.html>`_ under the `AGPL
<https://www.gnu.org/licenses/agpl-3.0.en.html>`_.

Example and screenshot
======================

See `PyPSA-Eur-30 <https://www.pypsa.org/animations/pypsa-eur-30/>`_ for a running example.

Screenshot:

.. image:: http://www.pypsa.org/img/pypsa-animation.png






How to use it
=============

First you have to convert your PyPSA network scenarios into folders of
JSON data files. For this, use the script ``export_network.py``,
adjusting path names for your own scenarios (the current example uses
the data from `PyPSA-Eur-30
<https://doi.org/10.5281/zenodo.804337>`_).

Then adjust the parameters in ``network.js`` and ``index.html``
appropriately.


License
=======

Copyright 2018 `Tom Brown <https://nworbmot.org/>`_

This program is free software: you can redistribute it and/or
modify it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation; either `version 3 of the
License <LICENSE.txt>`_, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
`GNU Affero General Public License <LICENSE.txt>`_ for more details.
